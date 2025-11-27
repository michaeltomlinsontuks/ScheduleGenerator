import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { SessionSerializer } from './session.serializer.js';

@Module({
  imports: [
    PassportModule.register({
      session: true,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, SessionSerializer],
  exports: [AuthService],
})
export class AuthModule {}
