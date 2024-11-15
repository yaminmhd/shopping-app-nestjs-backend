import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ProductsService } from './products.service';
import { CreateProductRequest } from './dto/create-product.request';
import { TokenPayload } from '../auth/token-payload.interface';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: DeepMocked<ProductsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: createMock<ProductsService>(),
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get(ProductsService);
  });

  it('should call products service when create is called', async () => {
    const mockedUser: TokenPayload = {
      userId: 12,
    };
    const createdProductResponse = {
      id: 1,
      name: 'product 1',
      description: 'description',
      price: 100,
      userId: mockedUser.userId,
    };
    const createProductRequest: CreateProductRequest = {
      name: 'product 1',
      description: 'description',
      price: 100,
    };
    (productsService.create as jest.Mock).mockResolvedValue(createdProductResponse);

    const result = await controller.create(createProductRequest, mockedUser);

    expect(result).toEqual(createdProductResponse);
  });
});
