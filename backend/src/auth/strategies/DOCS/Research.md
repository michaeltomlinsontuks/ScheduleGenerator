<!-- tyto-docs
tyto_docs: 1
kind: research
unit: backend/src/auth/strategies
researched_at_commit: 8283f838bf5461a61796bcaf955a0b402d924ea3
sources:
  - path: backend/src/auth/auth.module.ts
    blob_sha: 80b86f7378e4f3a4b610edf3d2a59ef0df62f08c
  - path: backend/src/auth/strategies/google.strategy.ts
    blob_sha: 4a0731c864872da8b9e1185d3898e69ee8e4166b
-->

# Research: backend/src/auth/strategies

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.backend-src-auth-strategies.f35d5bfb`

The strategies unit defines the exported GoogleUser interface, which describes a Google-authenticated user with string fields email, firstName, lastName, picture, accessToken, and an optional refreshToken.

- `backend/src/auth/strategies/google.strategy.ts` L7-L14 @4a0731c864872da8b9e1185d3898e69ee8e4166b

### `research.backend-src-auth-strategies.e20cc20a`

The strategies unit defines GoogleStrategy, an @Injectable() class that extends PassportStrategy(Strategy, 'google'), registering it as the Passport strategy named 'google'.

- `backend/src/auth/strategies/google.strategy.ts` L16-L17 @4a0731c864872da8b9e1185d3898e69ee8e4166b

### `research.backend-src-auth-strategies.fe4be2b9`

GoogleStrategy's constructor reads the Google OAuth client ID, client secret, and callback URL from ConfigService under the keys google.clientId, google.clientSecret, and google.callbackUrl, defaulting each to an empty string when the value is unset.

- `backend/src/auth/strategies/google.strategy.ts` L18-L25 @4a0731c864872da8b9e1185d3898e69ee8e4166b

### `research.backend-src-auth-strategies.74adf96b`

GoogleStrategy requests the OAuth scopes 'email', 'profile', 'https://www.googleapis.com/auth/calendar', and 'https://www.googleapis.com/auth/calendar.events', which grant full calendar access.

- `backend/src/auth/strategies/google.strategy.ts` L26-L31 @4a0731c864872da8b9e1185d3898e69ee8e4166b

### `research.backend-src-auth-strategies.88d6a03e`

GoogleStrategy.validate builds a GoogleUser from the verified Google profile, defaulting email, firstName, lastName, and picture to empty strings when the profile omits them, and passing the OAuth access and refresh tokens through.

- `backend/src/auth/strategies/google.strategy.ts` L35-L50 @4a0731c864872da8b9e1185d3898e69ee8e4166b

### `research.backend-src-auth-strategies.c71fd0cb`

GoogleStrategy.validate delegates user creation or update to AuthService.validateGoogleUser and completes the Passport verification callback with the resulting session user.

- `backend/src/auth/strategies/google.strategy.ts` L52-L55 @4a0731c864872da8b9e1185d3898e69ee8e4166b

### `research.backend-src-auth-strategies.f608b6bd`

AuthModule imports GoogleStrategy from the strategies unit and registers it as a provider, making the strategy available to the Passport module for the 'google' authentication flow.

- `backend/src/auth/auth.module.ts` L5-L5 @80b86f7378e4f3a4b610edf3d2a59ef0df62f08c
- `backend/src/auth/auth.module.ts` L19-L19 @80b86f7378e4f3a4b610edf3d2a59ef0df62f08c

## Open questions

None.
