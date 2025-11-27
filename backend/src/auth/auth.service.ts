import { Injectable } from '@nestjs/common';
import { GoogleUser } from './strategies/google.strategy.js';

export interface SessionUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
  refreshToken?: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  };
}

@Injectable()
export class AuthService {
  /**
   * Validates and stores user credentials from Google OAuth
   * @param user - The Google user profile with tokens
   * @returns The session user object
   */
  validateGoogleUser(user: GoogleUser): SessionUser {
    return {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      picture: user.picture,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    };
  }

  /**
   * Gets the authentication status for a session
   * @param user - The session user or undefined
   * @returns AuthStatus indicating if user is authenticated
   */
  getAuthStatus(user?: SessionUser): AuthStatus {
    if (!user || !user.accessToken) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
      },
    };
  }

  /**
   * Gets the access token from the session user
   * @param user - The session user
   * @returns The access token or undefined
   */
  getAccessToken(user?: SessionUser): string | undefined {
    return user?.accessToken;
  }

  /**
   * Gets the refresh token from the session user
   * @param user - The session user
   * @returns The refresh token or undefined
   */
  getRefreshToken(user?: SessionUser): string | undefined {
    return user?.refreshToken;
  }
}
