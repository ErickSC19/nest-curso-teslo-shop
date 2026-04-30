import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/dto/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage, Product } from './entities';
import { DataSource } from 'typeorm';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImagesRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto;

      const product = this.productsRepository.create({
        ...productDetails,
        images: images.map((image) =>
          this.productImagesRepository.create({ url: image }),
        ),
      });

      await this.productsRepository.save(product);

      return { ...product, images };
    } catch (error: any) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { limit = 10, offset = 0 } = paginationDto;
      const products = await this.productsRepository.find({
        take: limit,
        skip: offset,
        relations: { images: true },
      });
      return products.map(({ images, ...rest }) => ({
        ...rest,
        images: images ? images.map((img) => img.url) : [],
      }));
    } catch (error: any) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(term: string) {
    try {
      let prod: Product | null;
      if (isUUID(term)) {
        prod = await this.productsRepository.findOneBy({ id: term });
      } else {
        const queryBuilder = this.productsRepository.createQueryBuilder('prod');
        prod = await queryBuilder
          .leftJoinAndSelect('prod.images', 'images')
          .where('UPPER(title) =:title or slug =:slug', {
            title: term.toUpperCase(),
            slug: term.toLowerCase(),
          })
          .getOne();
      }
      if (!prod) {
        throw new NotFoundException(`Product with term ${term} not found`);
      }
      return {
        ...prod,
        images: prod.images ? prod.images.map((img) => img.url) : [],
      };
    } catch (error: any) {
      this.handleDBExceptions(error);
    }
  }

  async findOnePlain(term: string) {
    try {
      const product = await this.findOne(term);
      if (!product) {
        return null;
      }
      const { images = [], ...rest } = product;
      return {
        ...rest,
        images: images ? images.map((img) => img) : [],
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const { images, ...toUpdate } = updateProductDto;

      const product = await this.productsRepository.preload({
        id,
        ...toUpdate,
      });
      if (!product) {
        throw new NotFoundException(`Product with ID: ${id} not found`);
      }
      await queryRunner.connect();
      await queryRunner.startTransaction();
      if (images && Array.isArray(images)) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        product.images = images.map((image: string) =>
          this.productImagesRepository.create({ url: image }),
        );
      }
      //await this.productsRepository.save(product);
      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return this.findOnePlain(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      const prod = await this.productsRepository.findOneByOrFail({ id });
      await this.productsRepository.remove(prod);
    } catch (error: any) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error?.code === '23505') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new BadRequestException(error?.detail);
    }

    this.logger.error(error);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (Object.keys(error).includes('message')) {
      throw new InternalServerErrorException(
        'Unexpected error: ',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        error.message,
      );
    }
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }

  async deleteAllProducts() {
    const query = this.productsRepository.createQueryBuilder('product');
    try {
      return await query.delete().where({}).execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
}
