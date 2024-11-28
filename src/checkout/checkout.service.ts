import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ProductsService } from '../products/products.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly stripe: Stripe,
    private readonly productService: ProductsService,
    private readonly configService: ConfigService,
  ) {}

  async createSession(productId: number) {
    const product = await this.productService.getProduct(productId);
    return this.stripe.checkout.sessions.create({
      metadata: {
        productId,
      },
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: product.price * 100,
            product_data: {
              name: product.name,
              description: product.description,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: this.configService.getOrThrow('stripe.successUrl'),
      cancel_url: this.configService.getOrThrow('stripe.cancelUrl'),
    });
  }

  async handleCheckoutWebhooks(event: any) {
    if (event.type !== 'checkout.session.completed') {
      return;
    }

    const session = await this.stripe.checkout.sessions.retrieve(
      event.data.object.id,
    );

    await this.productService.update(parseInt(session.metadata.productId), {
      sold: true,
    });
  }
}
