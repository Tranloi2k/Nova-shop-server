import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { CartModule } from '../cart/cart.module';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderWebhookController } from './order-webhook.controller';
import { WebhookSecretGuard } from '../guard/webhook-secret.guard';
import { OwnsResourceGuard } from '../guard/owns-resource.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product]), CartModule],
  controllers: [OrderController, OrderWebhookController],
  providers: [OrderService, WebhookSecretGuard, OwnsResourceGuard],
  exports: [OrderService],
})
export class OrderModule {}
