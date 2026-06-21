import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cartService: CartService,
    private readonly dataSource: DataSource,
  ) {}

  async getOrders(userId: number): Promise<Record<string, unknown>[]> {
    const orders = await this.orderRepository.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => this.mapOrderToDto(order));
  }

  async createOrder(userId: number, dto: CreateOrderDto): Promise<Record<string, unknown>> {
    return this.dataSource.transaction(async (manager) => {
      // Check if order already exists to prevent duplicate creation (Idempotency check inside transaction)
      const existingOrder = await manager.findOne(Order, {
        where: { stripeSessionId: dto.stripeSessionId },
        relations: ['items'],
      });

      if (existingOrder) {
        return this.mapOrderToDto(existingOrder);
      }

      const order = manager.create(Order, {
        userId,
        stripeSessionId: dto.stripeSessionId,
        total: 0,
        status: 'processing',
        items: [],
      });

      const orderItems: OrderItem[] = [];

      if (dto.orderType === 'cart') {
        // Lấy giỏ hàng của user và các item trong transaction
        const cart = await manager.findOne(Cart, {
          where: { userId },
          relations: ['items', 'items.product'],
        });

        if (!cart || !cart.items || cart.items.length === 0) {
          throw new NotFoundException('Active cart is empty or not found');
        }

        let computedTotal = 0;
        for (const cartItem of cart.items) {
          // Decrement product stock atomically and verify sufficient stock
          const updateResult = await manager
            .createQueryBuilder()
            .update(Product)
            .set({ stock: () => `stock - ${cartItem.quantity}` })
            .where('id = :id AND stock >= :quantity', {
              id: cartItem.productId,
              quantity: cartItem.quantity,
            })
            .execute();

          if (updateResult.affected === 0) {
            throw new BadRequestException(
              `Product "${cartItem.product.name}" has insufficient stock or is unavailable`,
            );
          }

          const itemTotal = Number(cartItem.price) * cartItem.quantity;
          let itemDiscount = 0;
          if (cartItem.product.discount > 0) {
            itemDiscount = (itemTotal * cartItem.product.discount) / 100;
          }
          computedTotal += (itemTotal - itemDiscount);

          const orderItem = manager.create(OrderItem, {
            productId: cartItem.productId,
            productName: cartItem.product.name,
            productImage: cartItem.product.image,
            price: cartItem.price,
            quantity: cartItem.quantity,
            color: cartItem.color ?? '',
            storage: cartItem.storage ?? '',
          });
          orderItems.push(orderItem);
        }

        order.items = orderItems;
        order.total = computedTotal;
        const savedOrder = await manager.save(Order, order);

        // Xóa tất cả các cart items trong transaction
        await manager.remove(CartItem, cart.items);

        // Reset tổng số lượng trong cart về 0 và xóa tham chiếu items để tránh cascade save tự động lưu lại chúng
        cart.quantity = 0;
        cart.items = [];
        await manager.save(Cart, cart);

        return this.mapOrderToDto(savedOrder);
      } else {
        // Direct buy
        if (!dto.productId) {
          throw new NotFoundException('Product ID is required for direct purchase');
        }

        const quantity = dto.quantity || 1;

        // Decrement product stock atomically and verify sufficient stock
        const updateResult = await manager
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => `stock - ${quantity}` })
          .where('id = :id AND stock >= :quantity', {
            id: dto.productId,
            quantity,
          })
          .execute();

        if (updateResult.affected === 0) {
          const product = await manager.findOne(Product, { where: { id: dto.productId } });
          if (!product) {
            throw new NotFoundException(`Product with ID ${dto.productId} not found`);
          }
          throw new BadRequestException(
            `Product "${product.name}" has insufficient stock or is unavailable`,
          );
        }

        const product = await manager.findOne(Product, { where: { id: dto.productId } });
        if (!product) {
          throw new NotFoundException(`Product with ID ${dto.productId} not found`);
        }

        const itemTotal = Number(product.price) * quantity;
        let itemDiscount = 0;
        if (product.discount > 0) {
          itemDiscount = (itemTotal * product.discount) / 100;
        }
        const computedTotal = itemTotal - itemDiscount;

        const orderItem = manager.create(OrderItem, {
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          price: product.price,
          quantity,
        });

        order.items = [orderItem];
        order.total = computedTotal;
        const savedOrder = await manager.save(Order, order);

        return this.mapOrderToDto(savedOrder);
      }
    });
  }

  private mapOrderToDto(order: Order): Record<string, unknown> {
    return {
      id: `ORD-${order.id}`,
      date: order.createdAt
        ? new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
      status: order.status,
      total: Number(order.total),
      items: (order.items || []).map((item) => ({
        id: item.id,
        name: item.productName,
        image: item.productImage,
        price: Number(item.price),
        quantity: item.quantity,
        color: item.color || undefined,
        storage: item.storage || undefined,
      })),
    };
  }
}
