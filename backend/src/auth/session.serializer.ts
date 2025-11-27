import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { SessionUser } from './auth.service.js';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(
    user: SessionUser,
    done: (err: Error | null, user: SessionUser) => void,
  ): void {
    done(null, user);
  }

  deserializeUser(
    payload: SessionUser,
    done: (err: Error | null, user: SessionUser | null) => void,
  ): void {
    done(null, payload);
  }
}
