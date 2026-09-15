<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/components/auth
researched_at_commit: 0a54880da611d9c7e4ea67064b17ed0c465e1f7b
sources:
  - path: frontend/src/components/auth/GoogleLoginButton.tsx
    blob_sha: 1fc27027b805a5fcefa51f6050a2301c7498b4d2
  - path: frontend/src/components/auth/UserAvatar.tsx
    blob_sha: 203b6c4f7c5d74be64878f0274e1f878b7e13bae
  - path: frontend/src/components/auth/index.ts
    blob_sha: 9d2b78354f41cc1da5176557f966e7d663f52465
-->

# Research: frontend/src/components/auth

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-components-auth.303282e0`

GoogleLoginButton is a client-side React component ('use client') that renders a Google OAuth sign-in button and delegates the login action and loading state to the useAuth hook.

- `frontend/src/components/auth/GoogleLoginButton.tsx` L1-L37 @1fc27027b805a5fcefa51f6050a2301c7498b4d2

### `research.frontend-src-components-auth.4e3c25c4`

GoogleLoginButtonProps is an exported interface with a single optional className string prop.

- `frontend/src/components/auth/GoogleLoginButton.tsx` L5-L7 @1fc27027b805a5fcefa51f6050a2301c7498b4d2

### `research.frontend-src-components-auth.458794a1`

GoogleLoginButton renders a button with the CSS class 'google-signin-btn' plus any caller-supplied className, is disabled while the login is loading, and carries the aria-label 'Sign in with Google'.

- `frontend/src/components/auth/GoogleLoginButton.tsx` L17-L35 @1fc27027b805a5fcefa51f6050a2301c7498b4d2

### `research.frontend-src-components-auth.0d0488ed`

While loading, GoogleLoginButton shows a LoadingSpinner and the text 'Signing in...'; otherwise it shows a GoogleIcon and the text 'Continue with Google'.

- `frontend/src/components/auth/GoogleLoginButton.tsx` L24-L34 @1fc27027b805a5fcefa51f6050a2301c7498b4d2

### `research.frontend-src-components-auth.17a055dc`

GoogleIcon is a module-private SVG component that renders the official Google 'G' logo in the four brand colors.

- `frontend/src/components/auth/GoogleLoginButton.tsx` L42-L68 @1fc27027b805a5fcefa51f6050a2301c7498b4d2

### `research.frontend-src-components-auth.bf0ad798`

LoadingSpinner is a module-private SVG component that renders an animated (animate-spin) loading spinner.

- `frontend/src/components/auth/GoogleLoginButton.tsx` L73-L97 @1fc27027b805a5fcefa51f6050a2301c7498b4d2

### `research.frontend-src-components-auth.9d828014`

The GoogleLoginButton component is documented as following Google's branding guidelines and as satisfying requirements 3.1 and 7.1.

- `frontend/src/components/auth/GoogleLoginButton.tsx` L9-L13 @1fc27027b805a5fcefa51f6050a2301c7498b4d2

### `research.frontend-src-components-auth.bb264047`

UserAvatar is a client-side React component ('use client') that renders a user avatar with a dropdown menu built on the HTML <details> element.

- `frontend/src/components/auth/UserAvatar.tsx` L1-L83 @203b6c4f7c5d74be64878f0274e1f878b7e13bae

### `research.frontend-src-components-auth.b59e649e`

UserAvatarProps is an exported interface requiring a user of type AuthUser and an onLogout callback that takes no arguments and returns void.

- `frontend/src/components/auth/UserAvatar.tsx` L6-L9 @203b6c4f7c5d74be64878f0274e1f878b7e13bae

### `research.frontend-src-components-auth.84bd8abf`

UserAvatar closes its dropdown when a click occurs outside the details element, via a document-level click listener registered in a useEffect.

- `frontend/src/components/auth/UserAvatar.tsx` L18-L28 @203b6c4f7c5d74be64878f0274e1f878b7e13bae

### `research.frontend-src-components-auth.141f699a`

UserAvatar's handleLogout closes the dropdown and then invokes the onLogout prop.

- `frontend/src/components/auth/UserAvatar.tsx` L30-L35 @203b6c4f7c5d74be64878f0274e1f878b7e13bae

### `research.frontend-src-components-auth.182bea78`

The UserAvatar dropdown displays the user's picture, first and last name, and email, and includes a 'Sign out' button styled with the text-error class.

- `frontend/src/components/auth/UserAvatar.tsx` L37-L81 @203b6c4f7c5d74be64878f0274e1f878b7e13bae

### `research.frontend-src-components-auth.fd99686a`

LogoutIcon is a module-private SVG component that renders a logout arrow icon.

- `frontend/src/components/auth/UserAvatar.tsx` L85-L102 @203b6c4f7c5d74be64878f0274e1f878b7e13bae

### `research.frontend-src-components-auth.5364eb81`

The UserAvatar component is documented as satisfying requirements 3.3 and 3.4.

- `frontend/src/components/auth/UserAvatar.tsx` L11-L14 @203b6c4f7c5d74be64878f0274e1f878b7e13bae

### `research.frontend-src-components-auth.3458c6e3`

index.ts is a barrel module that re-exports GoogleLoginButton and its GoogleLoginButtonProps type, and UserAvatar and its UserAvatarProps type.

- `frontend/src/components/auth/index.ts` L1-L7 @9d2b78354f41cc1da5176557f966e7d663f52465

### `research.frontend-src-components-auth.553a2e3c`

The auth components barrel is documented as satisfying requirements 3.1 and 3.3.

- `frontend/src/components/auth/index.ts` L1-L4 @9d2b78354f41cc1da5176557f966e7d663f52465

## Open questions

None.
