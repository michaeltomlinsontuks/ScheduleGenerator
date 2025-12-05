import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    NestCacheModule.register({
      isGlobal: true,
      ttl: 300000, // Default TTL: 5 minutes (in milliseconds)
      max: 1000, // Maximum number of items in cache
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule { }
