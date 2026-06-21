import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ConfirmOrderWebhookDto {
  @ApiProperty({ description: 'User ID who placed the order' })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'Stripe Checkout Session ID' })
  @IsNotEmpty()
  @IsString()
  stripeSessionId: string;

  @ApiProperty({ description: 'Order type: cart or direct' })
  @IsNotEmpty()
  @IsString()
  @IsIn(['cart', 'direct'])
  orderType: string;

  @ApiProperty({ description: 'Product ID (for direct buy)', required: false })
  @IsOptional()
  @IsNumber()
  productId?: number;

  @ApiProperty({ description: 'Quantity (for direct buy)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}
