import { get } from 'env-var';
import '../utils/dotenv';

export const databaseConfig = {
  type: 'postgres',
  host: get('DATABASE_HOST').required().asString(),
  port: get('DATABASE_PORT').required().asIntPositive(),
  username: get('POSTGRES_USER').required().asString(),
  password: get('POSTGRES_PASSWORD').required().asString(),
  database: get('POSTGRES_DB').required().asString(),
};

export const postgresConnectionUri = `postgres://${databaseConfig.username}:${databaseConfig.password}@${databaseConfig.host}/${databaseConfig.database}`;
