import { Injectable } from '@nestjs/common';
import { GoogleUser } from './strategies/google.strategy.js';

export interface SessionUser {
  id: string;
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
   * Validates user credentials from Google OAuth
   * In this stateless version, we simply pass through the profile data
   * @param user - The Google user profile with tokens
   * @returns The session user object
   */
  async validateGoogleUser(user: GoogleUser): Promise<SessionUser> {
    // In a stateless/DB-less architecture, we don't save the user.
    // We just map the Google profile to our SessionUser structure.
    // We use the email as the ID since we don't have a DB UUID.
    return {
      id: user.email, // Use email as ID since we don't have a DB
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
