import { faker } from '@faker-js/faker';

export const products = Array.from({ length: 20 }, (_value, index) => ({
  id: index + 1,
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  price: Number(faker.commerce.price()),
}));
