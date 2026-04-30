import { Inject, Injectable } from '@nestjs/common';
import { ProductsService } from './../products/products.service';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {
  constructor(
    @Inject(ProductsService)
    private readonly productsService: ProductsService,
  ) {}

  async runSeed() {
    await this.insertNewProducts();
    return `SEED executed successfully!`;
  }

  private async insertNewProducts() {
    await this.productsService.deleteAllProducts();

    const seedProducts = initialData.products;

    const insertPromises: Promise<any>[] = [];

    seedProducts.forEach((product) => {
      insertPromises.push(this.productsService.create(product));
    });

    await Promise.all(insertPromises);

    return true;
  }
}
