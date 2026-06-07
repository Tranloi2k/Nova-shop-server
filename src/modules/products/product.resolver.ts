import { Resolver, Query, Mutation, Args, Float, Int, Parent, ResolveField } from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { CreateProductInput } from './dto/product.input';
import { Product } from './entities/product.entity';
import { ReviewService } from '../reviews/reviews.service';

@Resolver(() => Product)
export class ProductResolver {
  constructor(
    private readonly productService: ProductsService,
    private reviewsService: ReviewService,
  ) {}

  @Query(() => [Product], { name: 'products' })
  async findAll() {
    const result = await this.productService.findAll();
    return result.products;
  }

  @Query(() => Product, { name: 'product' })
  findOne(@Args('id', { type: () => Number }) id: number) {
    return this.productService.findOne(id);
  }

  @Mutation(() => Product, { name: 'createProduct' })
  create(@Args('createProductInput') createProductInput: CreateProductInput) {
    return this.productService.create(createProductInput);
  }

  //   @Mutation(() => Product, { name: 'updateProduct' })
  //   update(@Args('updateProductInput') updateProductInput: UpdateProductInput) {
  //     return this.productService.update(updateProductInput.id, updateProductInput);
  //   }

  @Mutation(() => Boolean, { name: 'deleteProduct' })
  delete(@Args('id', { type: () => Number }) id: number) {
    return this.productService.remove(id);
  }
  @ResolveField('rate', () => Float)
  getRate(@Parent() product: Product) {
    // Nếu đã load reviews, tính toán luôn
    if (product.reviews) {
      return product.reviews.reduce((a, b) => a + b.rating, 0) / product.reviews.length || 0;
    }

    // Hoặc query riêng nếu cần tối ưu
    return null;
  }

  @ResolveField('reviewCount', () => Int)
  getReviewCount(@Parent() product: Product) {
    if (product.reviews) {
      return product.reviews.length;
    }
    return this.reviewsService.countByProductId(product.id);
  }
}
