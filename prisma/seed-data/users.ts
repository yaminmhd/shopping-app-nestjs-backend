import { faker } from '@faker-js/faker';

const TEST_USER_PASS = 'P@ssword123!';

const emails = Array.from({ length: 5 }, () =>
  faker.internet.email({ provider: 'gmail.com' }),
);

export const users = emails.map((email) => ({
  email,
  password: TEST_USER_PASS,
}));
