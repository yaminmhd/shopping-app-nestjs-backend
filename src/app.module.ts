import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'nestjs-prisma';
import { postgresConnectionUri } from './config/database.config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CheckoutModule } from './checkout/checkout.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            transport: isProduction ? undefined : { target: 'pino-pretty' },
            options: {
              singleLine: true,
            },
            level: isProduction ? 'info' : 'debug',
          },
        };
      },
      inject: [ConfigService],
    }),
    // ConfigModule.forRoot({
    //   isGlobal: true,
    //   envFilePath: `${__dirname}/config/env/${process.env.NODE_ENV}.env`,
    //   load: [configuration],
    // }),
    PrismaModule.forRootAsync({
      isGlobal: true,
      useFactory: async () => {
        return {
          prismaOptions: {
            datasources: {
              db: {
                url: postgresConnectionUri,
              },
            },
          },
          explicitConnect: false,
        };
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '../public'),
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    CheckoutModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
