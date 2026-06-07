import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto, PRODUCT_CATEGORY_VALUES } from './dto/query-product.dto';
import { PaginatedProductResponseDto } from './dto/paginated-product-response.dto';
import { Product } from './entities/product.entity';

const CATEGORY_KEYWORDS: Record<(typeof PRODUCT_CATEGORY_VALUES)[number], string[]> = {
  smartphones: ['iphone', 'galaxy', 'pixel', 'phone', 'smartphone', 'oneplus', 'xiaomi'],
  tablets: ['ipad', 'tablet', ' tab', 'surface pro'],
  wearables: ['watch', 'airpods', 'buds', 'wearable', 'fitbit', 'earbuds', 'headphone'],
};

type ProductWithStats = Product & { rate: number; reviewCount: number };
// import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  private applyProductFilters(
    queryBuilder: ReturnType<Repository<Product>['createQueryBuilder']>,
    filters: {
      search?: string;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      onSale?: string;
    },
  ) {
    const { search, category, minPrice, maxPrice, onSale } = filters;

    if (search?.trim()) {
      queryBuilder.andWhere('(product.name LIKE :search OR product.description LIKE :search)', {
        search: `%${search.trim()}%`,
      });
    }

    if (category && CATEGORY_KEYWORDS[category as keyof typeof CATEGORY_KEYWORDS]) {
      const keywords = CATEGORY_KEYWORDS[category as keyof typeof CATEGORY_KEYWORDS];
      const categoryConditions = keywords
        .map(
          (_, index) =>
            `(LOWER(product.name) LIKE :cat${index} OR LOWER(product.description) LIKE :cat${index})`,
        )
        .join(' OR ');
      const categoryParams = Object.fromEntries(
        keywords.map((keyword, index) => [`cat${index}`, `%${keyword}%`]),
      );
      queryBuilder.andWhere(`(${categoryConditions})`, categoryParams);
    }

    if (minPrice !== undefined && !Number.isNaN(minPrice)) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined && !Number.isNaN(maxPrice)) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (onSale === 'true' || onSale === '1') {
      queryBuilder.andWhere('product.discount > 0');
    }
  }

  private mapProductsWithStats(products: Product[]): ProductWithStats[] {
    return products.map((product) => {
      const ratings = product.reviews?.map((review) => review.rating) ?? [];
      const averageRating =
        ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      return {
        ...product,
        rate: averageRating,
        reviewCount: product.reviews?.length ?? 0,
      };
    });
  }

  private sortProducts(products: ProductWithStats[], sort: string): ProductWithStats[] {
    const sorted = [...products];

    switch (sort) {
      case 'price-low':
        return sorted.sort((a, b) => Number(a.price) - Number(b.price));
      case 'price-high':
        return sorted.sort((a, b) => Number(b.price) - Number(a.price));
      case 'newest':
        return sorted.sort((a, b) => b.id - a.id);
      case 'rating':
        return sorted.sort((a, b) => b.rate - a.rate || b.id - a.id);
      case 'popular':
      default:
        return sorted.sort((a, b) => b.reviewCount - a.reviewCount || b.id - a.id);
    }
  }

  async findAll(queryDto?: QueryProductDto): Promise<PaginatedProductResponseDto> {
    const {
      search,
      category,
      sort = 'popular',
      minPrice,
      maxPrice,
      onSale,
      page = 1,
      limit = 10,
    } = queryDto || {};

    const filterParams = { search, category, minPrice, maxPrice, onSale };
    const skip = (page - 1) * limit;
    const sortInMemory = sort === 'popular' || sort === 'rating';

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.reviews', 'reviews');

    this.applyProductFilters(queryBuilder, filterParams);

    if (!sortInMemory) {
      switch (sort) {
        case 'price-low':
          queryBuilder.orderBy('product.price', 'ASC');
          break;
        case 'price-high':
          queryBuilder.orderBy('product.price', 'DESC');
          break;
        case 'newest':
        default:
          queryBuilder.orderBy('product.id', 'DESC');
          break;
      }
    } else {
      queryBuilder.orderBy('product.id', 'DESC');
    }

    let productsWithRating: ProductWithStats[];

    if (sortInMemory) {
      const products = await queryBuilder.getMany();
      productsWithRating = this.sortProducts(this.mapProductsWithStats(products), sort);
    } else {
      const total = await queryBuilder.getCount();
      const products = await queryBuilder.skip(skip).take(limit).getMany();
      productsWithRating = this.mapProductsWithStats(products);

      const totalPages = Math.ceil(total / limit);

      return {
        products: productsWithRating,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    }

    const total = productsWithRating.length;
    const paginatedProducts = productsWithRating.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      products: paginatedProducts,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id }, relations: ['reviews'] });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  //   async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
  //     const product = await this.findOne(id);
  //     Object.assign(product, updateProductDto);
  //     return this.productRepository.save(product);
  //   }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
