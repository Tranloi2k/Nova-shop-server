import { Injectable, NotFoundException } from '@nestjs/common';
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
        total: dto.total,
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

        for (const cartItem of cart.items) {
          const orderItem = manager.create(OrderItem, {
            productId: cartItem.productId,
            productName: cartItem.product.name,
            productImage: cartItem.product.image,
            price: cartItem.price,
            quantity: cartItem.quantity,
          });
          orderItems.push(orderItem);
        }

        order.items = orderItems;
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

        const product = await manager.findOne(Product, { where: { id: dto.productId } });
        if (!product) {
          throw new NotFoundException(`Product with ID ${dto.productId} not found`);
        }

        const orderItem = manager.create(OrderItem, {
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          price: product.price,
          quantity: dto.quantity || 1,
        });

        order.items = [orderItem];
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
      })),
    };
  }
}
