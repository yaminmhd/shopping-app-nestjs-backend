import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { response } from "express";

describe('ProductsController', () => {
  let app: INestApplication;
  let productsService: DeepMocked<ProductsService>;
  let jwtToken: string;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: createMock<ProductsService>(),
        },
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: () => 'test-secret',
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());

    productsService = moduleFixture.get(ProductsService);
    await app.init();

    const jwtService = moduleFixture.get<JwtService>(JwtService);
    jwtToken = jwtService.sign({ userId: '1' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/POST products authorized', () => {
    const createProductResponse = {
      id: 12,
      name: 'product 1',
      description: 'description',
      price: 120,
      userId: 1,
    };
    (productsService.create as jest.Mock).mockResolvedValue(
      createProductResponse,
    );
    return request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'product 1',
        description: 'description',
        price: 100,
      })
      .set('Cookie', [`Authentication=${jwtToken}`])
      .expect(201)
      .expect((response) => {
        expect(response.body).toEqual(createProductResponse);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('description');
        expect(response.body).toHaveProperty('price');
        expect(response.body).toHaveProperty('userId');
      });
  });
});
