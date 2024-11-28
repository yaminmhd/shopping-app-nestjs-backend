import { AwsParameterService } from './AwsParameterService';

export default async () => {
  const databaseUrl = `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?schema=public`;

  if (process.env.NODE_ENV === 'production') {
    const parameterService = new AwsParameterService();

    const appConfig = {
      host: await parameterService.getParameter(
        '/shoppingapp/prod/DATABASE_HOST',
      ),
      port: await parameterService.getParameter(
        '/shoppingapp/prod/DATABASE_PORT',
      ),
      username: await parameterService.getParameter(
        '/shoppingapp/prod/DATABASE_USER',
      ),
      password: await parameterService.getParameter(
        '/shoppingapp/prod/DATABASE_PASSWORD',
      ),
      name: await parameterService.getParameter(
        '/shoppingapp/prod/DATABASE_NAME',
      ),
      stripeKey: await parameterService.getParameter(
        '/shoppingapp/prod/STRIPE_SECRET_KEY',
      ),
      stripeSuccessUrl: await parameterService.getParameter(
        '/shoppingapp/prod/STRIPE_SUCCESS_URL',
      ),
      stripeCancelUrl: await parameterService.getParameter(
        '/shoppingapp/prod/STRIPE_CANCEL_URL',
      ),
      jwtSecret: await parameterService.getParameter(
        '/shoppingapp/prod/JWT_SECRET',
      ),
      jwtExpiration: await parameterService.getParameter(
        '/shoppingapp/prod/JWT_EXPIRATION',
      ),
    };

    return {
      port: parseInt(process.env.PORT, 10) || 3001,
      database: {
        url: databaseUrl,
        host: appConfig.host,
        port: appConfig.port,
        username: appConfig.username,
        password: appConfig.password,
        name: appConfig.name,
      },
      stripe: {
        secretKey: appConfig.stripeKey,
        successUrl: appConfig.stripeSuccessUrl,
        cancelUrl: appConfig.stripeCancelUrl,
      },
      jwt: {
        secret: appConfig.jwtSecret,
        expiration: appConfig.jwtExpiration,
      },
    };
  }

  return {
    port: parseInt(process.env.PORT, 10) || 3001,
    database: {
      url: databaseUrl,
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      name: process.env.DATABASE_NAME,
      pgadminEmail: process.env.PGADMIN_DEFAULT_EMAIL,
      pgadminPassword: process.env.PGADMIN_DEFAULT_PASSWORD,
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      successUrl: process.env.STRIPE_SUCCESS_URL,
      cancelUrl: process.env.STRIPE_CANCEL_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiration: process.env.JWT_EXPIRATION,
    },
  };
};
