
interface IVariables {
  port: number,
  database: string,
  globalPrefix: string
}

export const variables: IVariables = {
  port: parseInt(process.env.PORT) || 3000,
  database: process.env.DATABASE_NAME || "FIREBASE",
  globalPrefix: process.env.GLOBAL_PREFIX || "api",
}
