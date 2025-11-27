import * as fc from 'fast-check';
import { AuthService, SessionUser, AuthStatus } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  /**
   * Arbitrary generator for valid session users with access tokens
   */
  const validSessionUserArb = fc.record({
    email: fc.emailAddress(),
    firstName: fc.string({ minLength: 1, maxLength: 50 }),
    lastName: fc.string({ minLength: 1, maxLength: 50 }),
    picture: fc.webUrl(),
    accessToken: fc.string({ minLength: 10, maxLength: 500 }),
    refreshToken: fc.option(fc.string({ minLength: 10, maxLength: 500 }), { nil: undefined }),
  });

  /**
   * Arbitrary generator for session users without access tokens (invalid)
   */
  const invalidSessionUserArb = fc.record({
    email: fc.emailAddress(),
    firstName: fc.string({ minLength: 1, maxLength: 50 }),
    lastName: fc.string({ minLength: 1, maxLength: 50 }),
    picture: fc.webUrl(),
    accessToken: fc.constant(''), // Empty access token
    refreshToken: fc.option(fc.string({ minLength: 10, maxLength: 500 }), { nil: undefined }),
  });

  /**
   * **Feature: backend-implementation, Property 13: Auth Status Consistency**
   * **Validates: Requirements 5.3**
   *
   * For any session, the `/api/auth/status` endpoint SHALL return
   * `authenticated: true` if and only if valid Google credentials exist in the session.
   */
  describe('Property 13: Auth Status Consistency', () => {
    it('should return authenticated: true when valid credentials exist', () => {
      fc.assert(
        fc.property(validSessionUserArb, (user: SessionUser) => {
          const status: AuthStatus = authService.getAuthStatus(user);
          
          // Must be authenticated
          if (!status.authenticated) return false;
          
          // User info must be present
          if (!status.user) return false;
          
          // User info must match
          return (
            status.user.email === user.email &&
            status.user.firstName === user.firstName &&
            status.user.lastName === user.lastName &&
            status.user.picture === user.picture
          );
        }),
        { numRuns: 100 },
      );
    });

    it('should return authenticated: false when no user exists', () => {
      fc.assert(
        fc.property(fc.constant(undefined), () => {
          const status: AuthStatus = authService.getAuthStatus(undefined);
          
          // Must not be authenticated
          if (status.authenticated) return false;
          
          // User info must not be present
          return status.user === undefined;
        }),
        { numRuns: 100 },
      );
    });

    it('should return authenticated: false when access token is empty', () => {
      fc.assert(
        fc.property(invalidSessionUserArb, (user: SessionUser) => {
          const status: AuthStatus = authService.getAuthStatus(user);
          
          // Must not be authenticated when access token is empty
          if (status.authenticated) return false;
          
          // User info must not be present
          return status.user === undefined;
        }),
        { numRuns: 100 },
      );
    });

    it('should satisfy bidirectional implication: authenticated iff valid credentials', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            validSessionUserArb,
            invalidSessionUserArb,
            fc.constant(undefined as SessionUser | undefined),
          ),
          (user: SessionUser | undefined) => {
            const status: AuthStatus = authService.getAuthStatus(user);
            const hasValidCredentials = user !== undefined && user.accessToken !== '';
            
            // authenticated: true iff valid credentials exist
            return status.authenticated === hasValidCredentials;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: backend-implementation, Property 14: Logout Clears Session**
   * **Validates: Requirements 5.4**
   *
   * For any authenticated session, after calling `/api/auth/logout`,
   * subsequent calls to `/api/auth/status` SHALL return `authenticated: false`.
   *
   * Note: This property tests the service-level behavior. The actual session
   * clearing is handled by Express session middleware in the controller.
   * Here we verify that getAuthStatus correctly reports unauthenticated
   * when the user is cleared (simulating post-logout state).
   */
  describe('Property 14: Logout Clears Session', () => {
    it('should return authenticated: false after session is cleared', () => {
      fc.assert(
        fc.property(validSessionUserArb, (user: SessionUser) => {
          // First verify user is authenticated
          const beforeLogout: AuthStatus = authService.getAuthStatus(user);
          if (!beforeLogout.authenticated) return false;
          
          // Simulate logout by clearing the user (session destroyed)
          const afterLogout: AuthStatus = authService.getAuthStatus(undefined);
          
          // After logout, must not be authenticated
          return afterLogout.authenticated === false && afterLogout.user === undefined;
        }),
        { numRuns: 100 },
      );
    });

    it('should transition from authenticated to unauthenticated correctly', () => {
      fc.assert(
        fc.property(validSessionUserArb, (user: SessionUser) => {
          // Pre-condition: user has valid credentials
          const preLogoutStatus = authService.getAuthStatus(user);
          
          // Post-condition: after clearing user, status is unauthenticated
          const postLogoutStatus = authService.getAuthStatus(undefined);
          
          // Verify the transition
          return (
            preLogoutStatus.authenticated === true &&
            postLogoutStatus.authenticated === false
          );
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('validateGoogleUser', () => {
    it('should correctly transform GoogleUser to SessionUser', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.emailAddress(),
            firstName: fc.string({ minLength: 1, maxLength: 50 }),
            lastName: fc.string({ minLength: 1, maxLength: 50 }),
            picture: fc.webUrl(),
            accessToken: fc.string({ minLength: 10, maxLength: 500 }),
            refreshToken: fc.option(fc.string({ minLength: 10, maxLength: 500 }), { nil: undefined }),
          }),
          (googleUser) => {
            const sessionUser = authService.validateGoogleUser(googleUser);
            
            return (
              sessionUser.email === googleUser.email &&
              sessionUser.firstName === googleUser.firstName &&
              sessionUser.lastName === googleUser.lastName &&
              sessionUser.picture === googleUser.picture &&
              sessionUser.accessToken === googleUser.accessToken &&
              sessionUser.refreshToken === googleUser.refreshToken
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('getAccessToken', () => {
    it('should return access token when user exists', () => {
      fc.assert(
        fc.property(validSessionUserArb, (user: SessionUser) => {
          const token = authService.getAccessToken(user);
          return token === user.accessToken;
        }),
        { numRuns: 100 },
      );
    });

    it('should return undefined when user does not exist', () => {
      const token = authService.getAccessToken(undefined);
      expect(token).toBeUndefined();
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token when user exists and has one', () => {
      fc.assert(
        fc.property(validSessionUserArb, (user: SessionUser) => {
          const token = authService.getRefreshToken(user);
          return token === user.refreshToken;
        }),
        { numRuns: 100 },
      );
    });

    it('should return undefined when user does not exist', () => {
      const token = authService.getRefreshToken(undefined);
      expect(token).toBeUndefined();
    });
  });
});
