import { config } from 'dotenv';
import * as path from 'path';

// Initializing dotenv for application
const envPath: string = path.resolve(
  __dirname,
  process.env.NODE_ENV === 'test'
    ? '../config/env/test.env'
    : '../config/env/dev.env',
);
config({ path: envPath });
