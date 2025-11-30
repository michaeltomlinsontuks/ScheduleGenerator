import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleUser } from './strategies/google.strategy.js';
import { User } from './entities/user.entity.js';

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
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Validates and stores user credentials from Google OAuth
   * Creates or updates user in database
   * @param user - The Google user profile with tokens
   * @returns The session user object
   */
  async validateGoogleUser(user: GoogleUser): Promise<SessionUser> {
    // Find or create user in database
    let dbUser = await this.userRepository.findOne({
      where: { email: user.email },
    });

    if (!dbUser) {
      // Create new user with default quota
      dbUser = this.userRepository.create({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
        storageUsedBytes: 0,
        storageQuotaBytes: 52428800, // 50MB default
      });
      await this.userRepository.save(dbUser);
    } else {
      // Update user profile if changed
      let updated = false;
      if (dbUser.firstName !== user.firstName) {
        dbUser.firstName = user.firstName;
        updated = true;
      }
      if (dbUser.lastName !== user.lastName) {
        dbUser.lastName = user.lastName;
        updated = true;
      }
      if (dbUser.picture !== user.picture) {
        dbUser.picture = user.picture;
        updated = true;
      }
      if (updated) {
        await this.userRepository.save(dbUser);
      }
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      picture: dbUser.picture ?? '',
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
