import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { SessionSerializer } from './session.serializer.js';
import { IpBlockingService } from './ip-blocking.service.js';
import { IpBlockingGuard } from './guards/ip-blocking.guard.js';
import { User } from './entities/user.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({
      session: true,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    SessionSerializer,
    IpBlockingService,
    IpBlockingGuard,
  ],
  exports: [AuthService, IpBlockingService, IpBlockingGuard],
})
export class AuthModule {}
