import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductRequest } from './dto/create-product.request';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ProductsGateway } from './products.gateway';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

@Injectable()
export class ProductsService {
  private readonly s3Client = new S3Client({
    region: 'ap-southeast-1',
  });
  private readonly bucket = 'shop-app-products';

  constructor(
    private readonly prismaService: PrismaService,
    private readonly productGateway: ProductsGateway,
  ) {}

  async create(data: CreateProductRequest, userId: number) {
    const product = this.prismaService.product.create({
      data: {
        ...data,
        userId,
      },
    });
    this.productGateway.handleProductUpdated();
    return product;
  }

  async getProducts(status?: string) {
    const args: Prisma.ProductFindManyArgs = {};
    if (status === 'available') {
      args.where = { sold: false };
    }
    const products = await this.prismaService.product.findMany(args);
    return Promise.all(
      products.map(async (product) => ({
        ...product,
        imageExists: await this.imageExists(product.id),
      })),
    );
  }

  async getProduct(productId: number) {
    try {
      const product = await this.prismaService.product.findUniqueOrThrow({
        where: {
          id: productId,
        },
      });
      return {
        ...product,
        imageExists: await this.imageExists(productId),
      };
    } catch (error) {
      throw new NotFoundException(`Product not found with ID ${productId}`);
    }
  }

  async uploadProductImage(productId: string, file: Buffer) {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: `${productId}.jpg`,
        Body: file,
      }),
    );
  }

  async update(productId: number, data: Prisma.ProductUpdateInput) {
    await this.prismaService.product.update({
      where: {
        id: productId,
      },
      data,
    });
    this.productGateway.handleProductUpdated();
  }

  private async imageExists(productId: number) {
    try {
      const { Body } = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: `${productId}.jpg`,
        }),
      );
      return !!Body;
    } catch (error) {
      return false;
    }
  }
}
