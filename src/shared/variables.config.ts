interface IVariables {
  port: number;
  database: string;
  globalPrefix: string;
}

const parsedPort = parseInt(process.env.PORT ?? '3000', 10);

export const variables: IVariables = {
  port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3000,
  database: (process.env.DATABASE_NAME || 'IN-MEMORY').trim().toUpperCase(),
  globalPrefix: process.env.GLOBAL_PREFIX || 'api',
};
