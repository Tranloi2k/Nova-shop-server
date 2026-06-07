import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';

@ApiTags('order')
@Controller('user/:id/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user orders' })
  @ApiResponse({ status: 200, description: 'User orders retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getOrders(
    @Param('id') id: string,
    @Req() req: { user: { id: number } },
  ): Promise<Record<string, unknown>[]> {
    if (Number(req.user.id) !== Number(id)) {
      throw new UnauthorizedException('You can only access your own orders');
    }
    return this.orderService.getOrders(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order after checkout success' })
  @ApiResponse({ status: 201, description: 'Order created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createOrder(
    @Param('id') id: string,
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: { user: { id: number } },
  ): Promise<Record<string, unknown>> {
    if (Number(req.user.id) !== Number(id)) {
      throw new UnauthorizedException('You can only place orders for your own account');
    }
    return this.orderService.createOrder(Number(id), createOrderDto);
  }
}
