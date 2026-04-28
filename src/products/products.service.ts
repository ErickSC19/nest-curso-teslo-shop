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
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/dto/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productsRepository.create(createProductDto);
      await this.productsRepository.save(product);

      return product;
    } catch (error: any) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { limit = 10, offset = 0 } = paginationDto;
      return await this.productsRepository.find({
        take: limit,
        skip: offset,
      });
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
          .where('UPPER(title) =:title or slug =:slug', {
            title: term.toUpperCase(),
            slug: term.toLowerCase(),
          })
          .getOne();
      }
      if (!prod) {
        throw new NotFoundException(`Product with term ${term} not found`);
      }
      return prod;
    } catch (error: any) {
      this.handleDBExceptions(error);
    }
  }

  update(id: string, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
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
}
