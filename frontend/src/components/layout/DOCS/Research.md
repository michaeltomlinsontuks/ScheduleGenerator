<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/components/layout
researched_at_commit: 99d2ace33e54650a89f2caea295b567396085a08
sources:
  - path: frontend/src/components/layout/Container.tsx
    blob_sha: 63cc5ac6dbcdf1a1f46520a25e54890ec6aac132
  - path: frontend/src/components/layout/Footer.tsx
    blob_sha: 386909cb22c7920bcafa2bdad3e091a9196e8265
  - path: frontend/src/components/layout/Header.tsx
    blob_sha: e40ab92eb3bb6d20c83537e3365dfc8ac15409fd
  - path: frontend/src/components/layout/LayoutContent.tsx
    blob_sha: e5865a2707f2897bad673b3a63ecc5dda6de3701
  - path: frontend/src/components/layout/Stepper.tsx
    blob_sha: 76c832f668ca0075e24538094e0dd7f384576d6d
  - path: frontend/src/components/layout/ThemeProvider.tsx
    blob_sha: 9588cfa8528105b83f42a3bb70ce120cc57c1148
  - path: frontend/src/components/layout/index.ts
    blob_sha: 8106331635e7390f7cc0a796a7e8e62513ee326c
-->

# Research: frontend/src/components/layout

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-components-layout.cd2bf4ca`

Container is an exported React component that accepts children and an optional size prop restricted to 'sm', 'md', 'lg', or 'xl', defaulting to 'lg'.

- `frontend/src/components/layout/Container.tsx` L3-L6 @63cc5ac6dbcdf1a1f46520a25e54890ec6aac132
- `frontend/src/components/layout/Container.tsx` L15-L15 @63cc5ac6dbcdf1a1f46520a25e54890ec6aac132

### `research.frontend-src-components-layout.7cbb5644`

Container renders a centered, horizontally padded div whose max-width class is selected from the sizeClasses map ('sm' to max-w-screen-sm, 'md' to max-w-screen-md, 'lg' to max-w-screen-lg, 'xl' to max-w-screen-xl).

- `frontend/src/components/layout/Container.tsx` L8-L13 @63cc5ac6dbcdf1a1f46520a25e54890ec6aac132
- `frontend/src/components/layout/Container.tsx` L15-L20 @63cc5ac6dbcdf1a1f46520a25e54890ec6aac132

### `research.frontend-src-components-layout.bee97a32`

index.ts is the unit's barrel module, re-exporting Container, Header, Footer, Stepper, ThemeProvider, and LayoutContent.

- `frontend/src/components/layout/index.ts` L1-L6 @8106331635e7390f7cc0a796a7e8e62513ee326c

### `research.frontend-src-components-layout.2dbe3c00`

Footer is an exported React component that accepts an optional minimal boolean prop, defaulting to false.

- `frontend/src/components/layout/Footer.tsx` L4-L6 @386909cb22c7920bcafa2bdad3e091a9196e8265
- `frontend/src/components/layout/Footer.tsx` L8-L8 @386909cb22c7920bcafa2bdad3e091a9196e8265

### `research.frontend-src-components-layout.753fd871`

When minimal is true, Footer renders a compact footer containing only the text 'Tuks Schedule Generator'.

- `frontend/src/components/layout/Footer.tsx` L10-L18 @386909cb22c7920bcafa2bdad3e091a9196e8265

### `research.frontend-src-components-layout.351e82e0`

The full Footer renders the 'Tuks Schedule Generator' brand with the tagline 'Convert your Tuks PDF schedule to calendar events', main navigation links (Home, Upload, About, GitHub), and legal links (Privacy Policy, Terms of Service).

- `frontend/src/components/layout/Footer.tsx` L20-L71 @386909cb22c7920bcafa2bdad3e091a9196e8265

### `research.frontend-src-components-layout.e97f6bb3`

Header is an exported React client component that accepts showNav (default true), showStepper (default false), and currentStep (1 | 2 | 3 | 4) props.

- `frontend/src/components/layout/Header.tsx` L1-L1 @e40ab92eb3bb6d20c83537e3365dfc8ac15409fd
- `frontend/src/components/layout/Header.tsx` L10-L14 @e40ab92eb3bb6d20c83537e3365dfc8ac15409fd
- `frontend/src/components/layout/Header.tsx` L67-L67 @e40ab92eb3bb6d20c83537e3365dfc8ac15409fd

### `research.frontend-src-components-layout.bad54d98`

Header manages a light/dark theme through a themeStore built on the useSyncExternalStore pattern, persisting the theme to localStorage under the 'theme' key and applying it to the document via the data-theme attribute on documentElement.

- `frontend/src/components/layout/Header.tsx` L16-L41 @e40ab92eb3bb6d20c83537e3365dfc8ac15409fd

### `research.frontend-src-components-layout.39c78d84`

The useTheme hook returns { theme, setTheme }, subscribing to themeStore via useSyncExternalStore and updating the theme through themeStore.setTheme.

- `frontend/src/components/layout/Header.tsx` L44-L56 @e40ab92eb3bb6d20c83537e3365dfc8ac15409fd

### `research.frontend-src-components-layout.2595932a`

The useIsMounted hook returns true only after the component has mounted on the client, using useSyncExternalStore with a server snapshot of false.

- `frontend/src/components/layout/Header.tsx` L59-L65 @e40ab92eb3bb6d20c83537e3365dfc8ac15409fd

### `research.frontend-src-components-layout.b5f97daa`

Header renders a brand link to '/', an optional Stepper (centered on desktop and below the navbar on mobile when showStepper and currentStep are set), auth UI that shows UserAvatar when authenticated and GoogleLoginButton otherwise, and a theme toggle switch.

- `frontend/src/components/layout/Header.tsx` L67-L145 @e40ab92eb3bb6d20c83537e3365dfc8ac15409fd

### `research.frontend-src-components-layout.e705d5a8`

Header destructures a showNav prop that is not referenced anywhere in its rendered output.

- `frontend/src/components/layout/Header.tsx` L10-L14 @e40ab92eb3bb6d20c83537e3365dfc8ac15409fd
- `frontend/src/components/layout/Header.tsx` L67-L67 @e40ab92eb3bb6d20c83537e3365dfc8ac15409fd
- `frontend/src/components/layout/Header.tsx` L77-L145 @e40ab92eb3bb6d20c83537e3365dfc8ac15409fd

### `research.frontend-src-components-layout.d2c0c5cd`

LayoutContent is a client component that composes ThemeProvider, Header, a main element, and Footer around its children.

- `frontend/src/components/layout/LayoutContent.tsx` L1-L1 @e5865a2707f2897bad673b3a63ecc5dda6de3701
- `frontend/src/components/layout/LayoutContent.tsx` L6-L28 @e5865a2707f2897bad673b3a63ecc5dda6de3701

### `research.frontend-src-components-layout.7847992d`

LayoutContent derives stepper props from the current pathname: '/upload' maps to step 1, '/preview' to step 2, '/customize' to step 3, '/generate' to step 4, and any other path renders no stepper.

- `frontend/src/components/layout/LayoutContent.tsx` L7-L18 @e5865a2707f2897bad673b3a63ecc5dda6de3701

### `research.frontend-src-components-layout.8b0c3aaa`

Stepper is an exported React client component that renders a horizontal 4-step progress indicator with the steps Upload, Preview, Customize, and Generate.

- `frontend/src/components/layout/Stepper.tsx` L1-L1 @76c832f668ca0075e24538094e0dd7f384576d6d
- `frontend/src/components/layout/Stepper.tsx` L3-L13 @76c832f668ca0075e24538094e0dd7f384576d6d
- `frontend/src/components/layout/Stepper.tsx` L41-L58 @76c832f668ca0075e24538094e0dd7f384576d6d

### `research.frontend-src-components-layout.90f5e044`

Stepper classifies each step as 'completed', 'current', or 'future': steps listed in completedSteps or numbered below currentStep are completed, the step equal to currentStep is current, and the rest are future.

- `frontend/src/components/layout/Stepper.tsx` L15-L39 @76c832f668ca0075e24538094e0dd7f384576d6d

### `research.frontend-src-components-layout.c6a6cabf`

ThemeProvider is an exported React client component that, on mount, reads the saved theme from localStorage and applies it to the document via the data-theme attribute on documentElement, rendering its children unchanged.

- `frontend/src/components/layout/ThemeProvider.tsx` L1-L1 @9588cfa8528105b83f42a3bb70ce120cc57c1148
- `frontend/src/components/layout/ThemeProvider.tsx` L5-L17 @9588cfa8528105b83f42a3bb70ce120cc57c1148

## Open questions

None.
