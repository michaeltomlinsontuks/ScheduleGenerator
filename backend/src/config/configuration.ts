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
    password: process.env.REDIS_PASSWORD,
  },
  minio: {
    // Fallback to AWS S3 / Tigris environment variables if MINIO_* specific ones aren't set
    endpoint:
      process.env.MINIO_ENDPOINT ??
      process.env.AWS_ENDPOINT_URL_S3 ??
      'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '443', 10), // Default to 443 for S3/Tigris
    accessKey:
      process.env.MINIO_ACCESS_KEY ??
      process.env.AWS_ACCESS_KEY_ID ??
      'minioadmin',
    secretKey:
      process.env.MINIO_SECRET_KEY ??
      process.env.AWS_SECRET_ACCESS_KEY ??
      'minioadmin',
    bucket:
      process.env.MINIO_BUCKET ?? process.env.BUCKET_NAME ?? 'pdf-uploads',
    useSSL:
      process.env.MINIO_USE_SSL === 'true' ||
      !!process.env.AWS_ENDPOINT_URL_S3, // Auto-enable SSL for Tigris/S3
    region: process.env.MINIO_REGION ?? process.env.AWS_REGION ?? 'auto',
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
