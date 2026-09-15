<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend/src/app/cv
researched_at_commit: a3779e82cfd51ff48988d091b1a3826f9ae70f2e
sources:
  - path: frontend/src/app/cv/page.tsx
    blob_sha: 5786a03889f33a9ab8f1098090bc1800dae5e219
-->

# Research: frontend/src/app/cv

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend-src-app-cv.e0639369`

frontend/src/app/cv/page.tsx is a Next.js client component page ('use client') that imports React and the Link component from next/link.

- `frontend/src/app/cv/page.tsx` L1-L4 @5786a03889f33a9ab8f1098090bc1800dae5e219

### `research.frontend-src-app-cv.c374f011`

The page defines a VersionSection interface with version, title, period, color, and content fields, where color is one of 'primary', 'secondary', or 'accent' and content is an array of blocks each with an optional heading and a list of items.

- `frontend/src/app/cv/page.tsx` L6-L15 @5786a03889f33a9ab8f1098090bc1800dae5e219

### `research.frontend-src-app-cv.651fd033`

The timelineData constant holds three VersionSection entries describing the project's evolution: V1 'Problem Discovery' (Late 2024 to Early 2025, primary), V2 'CLI Tool & API Integration' (Late 2025, secondary), and V3 'Web Application & DevOps' (Late 2025 to Present, accent).

- `frontend/src/app/cv/page.tsx` L17-L138 @5786a03889f33a9ab8f1098090bc1800dae5e219

### `research.frontend-src-app-cv.96a7476a`

The VersionCard component renders a card with a color-derived left border and badge, a header showing the version badge, title, and period, and each content block as an optional heading followed by a bulleted list of items.

- `frontend/src/app/cv/page.tsx` L140-L188 @5786a03889f33a9ab8f1098090bc1800dae5e219

### `research.frontend-src-app-cv.5d876d6d`

The CVPage component renders a hero section with the heading 'Development Journey' and a subtitle describing the evolution of the Tuks Schedule Generator.

- `frontend/src/app/cv/page.tsx` L190-L201 @5786a03889f33a9ab8f1098090bc1800dae5e219

### `research.frontend-src-app-cv.2eda6491`

CVPage maps over timelineData and renders a VersionCard for each section in a vertical timeline.

- `frontend/src/app/cv/page.tsx` L203-L208 @5786a03889f33a9ab8f1098090bc1800dae5e219

### `research.frontend-src-app-cv.74f3a176`

The page ends with a footer call-to-action card offering 'Back to Home' and 'View Source' buttons that link to '/' and the GitHub repository respectively, with the repository link opening in a new tab.

- `frontend/src/app/cv/page.tsx` L210-L232 @5786a03889f33a9ab8f1098090bc1800dae5e219

## Open questions

None.
