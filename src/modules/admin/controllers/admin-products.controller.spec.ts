import { Test, TestingModule } from '@nestjs/testing';
import { AdminProductsController } from './admin-products.controller';
import { AdminService } from '../admin.service';
import { BadRequestException } from '@nestjs/common';

describe('AdminProductsController', () => {
  let controller: AdminProductsController;
  let service: any;

  beforeEach(async () => {
    const mockAdminService = {
      getProducts: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProductsController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminProductsController>(AdminProductsController);
    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProducts', () => {
    it('should call service.getProducts with parsed params', async () => {
      service.getProducts.mockResolvedValue({ products: [], total: 0 });
      const result = await controller.getProducts('2', '5', 'iPhone', '10');
      expect(service.getProducts).toHaveBeenCalledWith(2, 5, 'iPhone', 10);
      expect(result.total).toBe(0);
    });
  });

  describe('uploadImage', () => {
    it('should throw BadRequestException if file is missing', async () => {
      await expect(controller.uploadImage('1', null as any, {})).rejects.toThrow(BadRequestException);
    });

    it('should update product image and return static URL', async () => {
      const mockFile = { filename: 'test.jpg' };
      const mockReq = { headers: { host: 'localhost:5000' } };
      service.updateProduct.mockResolvedValue({ id: 1, image: 'http://localhost:5000/uploads/test.jpg' });

      const result = await controller.uploadImage('1', mockFile as any, mockReq);
      expect(service.updateProduct).toHaveBeenCalledWith(1, { image: 'http://localhost:5000/uploads/test.jpg' });
      expect(result.imageUrl).toBe('http://localhost:5000/uploads/test.jpg');
    });
  });
});
