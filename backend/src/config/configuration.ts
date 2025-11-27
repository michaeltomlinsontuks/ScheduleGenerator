export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  database: {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    username: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    database: process.env.POSTGRES_DB ?? 'up_schedule',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    bucket: process.env.MINIO_BUCKET ?? 'pdf-uploads',
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ??
      'http://localhost:3001/api/auth/google/callback',
  },
  frontend: {
    url: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  },
  parser: {
    url: process.env.PARSER_URL ?? 'http://localhost:5000',
  },
});
