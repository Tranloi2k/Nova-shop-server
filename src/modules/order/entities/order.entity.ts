import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/user/user.entity';
import type { OrderItem } from './order-item.entity';

const OrderItemEntity = (): typeof OrderItem => require('./order-item.entity').OrderItem;

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ unique: true })
  stripeSessionId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ default: 'processing' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(OrderItemEntity, (orderItem: OrderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];
}
