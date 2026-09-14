<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/app
researched_at_commit: 19a9e0043e2a79783d62618aef1fccbd51438dc4
sources:
  - path: frontend/src/app/globals.css
    blob_sha: 98e2168d75f5139669f0711cb6f7025099531083
  - path: frontend/src/app/layout.tsx
    blob_sha: ac8514eb46d20a154682562a9ef0f956863c644c
  - path: frontend/src/app/page.tsx
    blob_sha: 7b9a8502d909ea59c9e3cab7597b80d3936d0397
-->

# Research: frontend/src/app

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-app.3f5ad31d`

frontend/src/app/layout.tsx imports the Metadata type from 'next', the Geist and Geist_Mono fonts from 'next/font/google', the global stylesheet './globals.css', and the LayoutContent component from '@/components/layout/LayoutContent'.

- `frontend/src/app/layout.tsx` L1-L4 @ac8514eb46d20a154682562a9ef0f956863c644c

### `research.frontend-src-app.ff2ac21d`

frontend/src/app/layout.tsx defines a geistSans constant that instantiates the Geist font with the CSS variable '--font-geist-sans' and the latin subset.

- `frontend/src/app/layout.tsx` L6-L9 @ac8514eb46d20a154682562a9ef0f956863c644c

### `research.frontend-src-app.856b96aa`

frontend/src/app/layout.tsx defines a geistMono constant that instantiates the Geist_Mono font with the CSS variable '--font-geist-mono' and the latin subset.

- `frontend/src/app/layout.tsx` L11-L14 @ac8514eb46d20a154682562a9ef0f956863c644c

### `research.frontend-src-app.0e104ca6`

frontend/src/app/layout.tsx exports a metadata object declaring the page title 'Tuks Schedule Generator', the description 'Convert your Tuks PDF schedule to calendar events', and the icon '/favicon.png'.

- `frontend/src/app/layout.tsx` L16-L22 @ac8514eb46d20a154682562a9ef0f956863c644c

### `research.frontend-src-app.300cc84c`

frontend/src/app/layout.tsx exports a default RootLayout component that renders an <html> element with lang 'en' and data-theme 'schedule-light', and a <body> that applies the geistSans and geistMono CSS variables with the classes 'antialiased min-h-screen bg-base-100 flex flex-col', wrapping the children in the LayoutContent component.

- `frontend/src/app/layout.tsx` L24-L39 @ac8514eb46d20a154682562a9ef0f956863c644c

### `research.frontend-src-app.4cbacf2a`

frontend/src/app/page.tsx begins with the 'use client' directive, marking the module as a client component.

- `frontend/src/app/page.tsx` L1-L1 @7b9a8502d909ea59c9e3cab7597b80d3936d0397

### `research.frontend-src-app.3fed86c7`

frontend/src/app/page.tsx imports Link from 'next/link' and the Button component from '@/components/common'.

- `frontend/src/app/page.tsx` L3-L4 @7b9a8502d909ea59c9e3cab7597b80d3936d0397

### `research.frontend-src-app.04e4ad6e`

frontend/src/app/page.tsx exports a default Home component that renders a hero section headed by the title 'Tuks Schedule Generator', a description of transforming a Tuks PDF schedule into calendar events, and a 'Get Started' Link to '/upload' containing a primary Button.

- `frontend/src/app/page.tsx` L6-L28 @7b9a8502d909ea59c9e3cab7597b80d3936d0397

### `research.frontend-src-app.c3887a51`

The Home component renders a 'How It Works' section with three feature cards titled 'Upload PDF', 'Preview Events', and 'Export Calendar', describing the upload, preview, and export steps of the service.

- `frontend/src/app/page.tsx` L30-L74 @7b9a8502d909ea59c9e3cab7597b80d3936d0397

### `research.frontend-src-app.fc596589`

frontend/src/app/globals.css imports Tailwind CSS and registers the daisyUI plugin.

- `frontend/src/app/globals.css` L1-L2 @98e2168d75f5139669f0711cb6f7025099531083

### `research.frontend-src-app.d210f15b`

frontend/src/app/globals.css defines a 'schedule-light' daisyUI theme, set as the default with a light color scheme, using oklch color variables with an electric blue accent.

- `frontend/src/app/globals.css` L4-L39 @98e2168d75f5139669f0711cb6f7025099531083

### `research.frontend-src-app.9ceebbfe`

frontend/src/app/globals.css defines a 'schedule-dark' daisyUI theme, set to prefer dark mode with a dark color scheme, using deep black backgrounds with an electric blue accent.

- `frontend/src/app/globals.css` L41-L76 @98e2168d75f5139669f0711cb6f7025099531083

### `research.frontend-src-app.1c965720`

frontend/src/app/globals.css sets the body font-family to Arial, Helvetica, sans-serif.

- `frontend/src/app/globals.css` L78-L80 @98e2168d75f5139669f0711cb6f7025099531083

### `research.frontend-src-app.c1fc1b65`

frontend/src/app/globals.css styles a .google-signin-btn class for light mode with a white background, pill shape, and hover, active, focus, and disabled states.

- `frontend/src/app/globals.css` L82-L116 @98e2168d75f5139669f0711cb6f7025099531083

### `research.frontend-src-app.665ac2f9`

frontend/src/app/globals.css provides dark-mode overrides for the .google-signin-btn class under the [data-theme='schedule-dark'] selector.

- `frontend/src/app/globals.css` L118-L136 @98e2168d75f5139669f0711cb6f7025099531083

### `research.frontend-src-app.415ff023`

The unit frontend/src/app consists of three source files: frontend/src/app/globals.css, frontend/src/app/layout.tsx, and frontend/src/app/page.tsx.

- `frontend/src/app/globals.css` L1-L137 @98e2168d75f5139669f0711cb6f7025099531083
- `frontend/src/app/layout.tsx` L1-L40 @ac8514eb46d20a154682562a9ef0f956863c644c
- `frontend/src/app/page.tsx` L1-L78 @7b9a8502d909ea59c9e3cab7597b80d3936d0397

## Open questions

None.
