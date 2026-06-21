import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { Cart } from 'src/modules/cart/entities/cart.entity';

@ObjectType() // Đánh dấu class là một GraphQL Object Type
@Entity('users')
export class User {
  @Field() // Đánh dấu trường là một GraphQL Field
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  username: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  refreshToken: string;

  @Field()
  @Column({ default: 'customer' })
  role: string;

  @Field(() => [Cart], { nullable: true })
  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];
}
