import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Product } from '@prisma/client';
import { CreateProductRequest } from './dto/create-product.request';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: DeepMocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: createMock<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get(PrismaService);
  });

  it('should create product successfully', async () => {
    const userId = 1;
    const product: Product = {
      id: 1,
      name: 'product',
      description: 'description',
      price: 100,
      userId: 1,
    };

    const productRequestPayload: CreateProductRequest = {
      name: 'product',
      description: 'description',
      price: 100,
    };

    (prismaService.product.create as jest.Mock).mockResolvedValueOnce(product);

    const result = await service.create(productRequestPayload, userId);

    expect(result).toEqual(product);
    expect(prismaService.product.create).toHaveBeenCalledWith({
      data: { ...productRequestPayload, userId },
    });
  });
});
