import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'Stripe Checkout Session ID', example: 'cs_test_...' })
  @IsNotEmpty()
  @IsString()
  stripeSessionId: string;

  @ApiProperty({ description: 'Total amount of the order', example: 1049.0 })
  @IsNotEmpty()
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Order type: cart or direct', example: 'cart' })
  @IsNotEmpty()
  @IsString()
  orderType: string;

  @ApiProperty({ description: 'Product ID (for direct buy)', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  productId?: number;

  @ApiProperty({ description: 'Quantity (for direct buy)', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  quantity?: number;
}
