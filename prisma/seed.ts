import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { users } from './seed-data/users';
import { products } from './seed-data/products';

const prisma = new PrismaClient();

function getRandomValue<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

async function main() {
  const userPromises = Promise.all([
    ...users.map(async (user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: user,
        create: {
          email: user.email,
          password: await hashPassword(user.password),
        },
      }),
    ),
  ]);

  const [createdUsers] = await Promise.all([userPromises]);

  const productPromises = Promise.all([
    ...products.map(async (product) =>
      prisma.product.upsert({
        where: { id: product.id },
        update: {},
        create: {
          name: product.name,
          price: product.price,
          description: product.description,
          userId: getRandomValue(createdUsers.map((user) => user.id)),
        },
      }),
    ),
  ]);

  const [createdProducts] = await Promise.all([productPromises]);
  console.log({
    createdUsers: [...createdUsers],
    createdProducts: [...createdProducts],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
