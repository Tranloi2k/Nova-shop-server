import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'The name of the product', example: 'Laptop' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The description of the product',
    example: 'A high-performance laptop',
  })
  @IsString()
  description: string;

  @ApiProperty({ description: 'The price of the product', example: 1500 })
  @IsNumber()
  @IsNotEmpty()
  price: number;
}
