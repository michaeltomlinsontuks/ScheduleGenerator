<!-- tyto-docs
tyto_docs: 1
kind: research
unit: frontend
researched_at_commit: 7c06166782b5e9a27e267eee38f69cd517fa1bfc
sources:
  - path: frontend/.dockerignore
    blob_sha: a36c5495c480d39a05c31b8e78df799930b260ee
  - path: frontend/.gitignore
    blob_sha: 5ef6a520780202a1d6addd833d800ccb1ecac0bb
  - path: frontend/Dockerfile
    blob_sha: 5f0a54e2e382b74050c49729a54cd70e2bb2b615
  - path: frontend/Dockerfile.dev
    blob_sha: f94a64552958f113b1d9049e162f9749df3d27c0
  - path: frontend/README.md
    blob_sha: e215bc4ccf138bbc38ad58ad57e92135484b3c0f
  - path: frontend/eslint.config.mjs
    blob_sha: 05e726d1b4201bc8c7716d2b058279676582e8c0
  - path: frontend/fly.toml
    blob_sha: 2d7635d88794bb1073bb54eae64a4a98122b8f87
  - path: frontend/next.config.ts
    blob_sha: 225e49520462b8b4b15841fc6752d5c72ff4ed4a
  - path: frontend/package-lock.json
    blob_sha: 6cc5d58f2c0fc6055992468c70d8f7ffe2e6e3da
  - path: frontend/package.json
    blob_sha: dad3427fdfc8b086c15cd5f71f675a58f0ca96d0
  - path: frontend/postcss.config.mjs
    blob_sha: 61e36849cf7cfa9f1f71b4a3964a4953e3e243d3
  - path: frontend/tsconfig.json
    blob_sha: cf9c65d3e0676a0169374d827f7abb97497789ef
  - path: frontend/vitest.config.ts
    blob_sha: ead15e2aa71542cbe1f0245e942994b5f7164ac2
-->

# Research: frontend

Permanent research. Update this living knowledge base with existing findings plus the
current source diff. It is never deleted or truncated after publication.

## Findings

### `research.frontend.203241bb`

The frontend directory is a private Next.js application named 'frontend' (version 0.1.0) declared in frontend/package.json.

- `frontend/package.json` L1-L4 @dad3427fdfc8b086c15cd5f71f675a58f0ca96d0

### `research.frontend.bf43bc45`

frontend/package.json declares npm scripts for development (next dev), building (next build), starting (next start), linting (eslint), and testing (vitest --run and vitest for watch mode).

- `frontend/package.json` L5-L12 @dad3427fdfc8b086c15cd5f71f675a58f0ca96d0

### `research.frontend.4a63769d`

The frontend's runtime dependencies are the Next.js framework (next 16.0.5), React (react 19.2.0 and react-dom 19.2.0), and supporting libraries (axios, date-fns, and zustand).

- `frontend/package.json` L13-L20 @dad3427fdfc8b086c15cd5f71f675a58f0ca96d0

### `research.frontend.7363fcd8`

The frontend's devDependencies provide Tailwind CSS tooling (@tailwindcss/postcss, tailwindcss, daisyui), testing tooling (@testing-library/jest-dom, @testing-library/react, @vitejs/plugin-react, @vitest/coverage-v8, fast-check, jsdom, vitest), and linting and type tooling (eslint, eslint-config-next, typescript, @types/node, @types/react, @types/react-dom).

- `frontend/package.json` L21-L38 @dad3427fdfc8b086c15cd5f71f675a58f0ca96d0

### `research.frontend.030b94bb`

frontend/tsconfig.json compiles the frontend with strict TypeScript checks, an ES2017 target, bundler module resolution, the react-jsx JSX transform, and a path alias '@/*' mapping to './src/*'.

- `frontend/tsconfig.json` L1-L34 @cf9c65d3e0676a0169374d827f7abb97497789ef

### `research.frontend.c15fdf17`

frontend/next.config.ts configures Next.js with standalone output.

- `frontend/next.config.ts` L1-L5 @225e49520462b8b4b15841fc6752d5c72ff4ed4a

### `research.frontend.e676a84c`

frontend/postcss.config.mjs configures PostCSS with the @tailwindcss/postcss plugin.

- `frontend/postcss.config.mjs` L1-L5 @61e36849cf7cfa9f1f71b4a3964a4953e3e243d3

### `research.frontend.c108b046`

frontend/eslint.config.mjs configures ESLint with the flat config format, applying the eslint-config-next core-web-vitals and TypeScript rule sets, with global ignores for .next, out, build, and next-env.d.ts.

- `frontend/eslint.config.mjs` L1-L16 @05e726d1b4201bc8c7716d2b058279676582e8c0

### `research.frontend.67a7c90f`

The production Dockerfile builds the frontend in three stages on node:20-alpine, installs dependencies with npm ci, builds the application with npm run build, runs as a non-root 'nextjs' user, exposes port 3000, and starts the standalone server with node server.js.

- `frontend/Dockerfile` L1-L80 @5f0a54e2e382b74050c49729a54cd70e2bb2b615

### `research.frontend.c3d93d65`

The development Dockerfile runs the frontend on node:20-alpine, installs all dependencies including devDependencies with npm install, exposes port 3000, and starts the development server with npm run dev.

- `frontend/Dockerfile.dev` L1-L27 @f94a64552958f113b1d9049e162f9749df3d27c0

### `research.frontend.10e6abc2`

frontend/fly.toml deploys the frontend to Fly.io as app 'schedgen-frontend' with primary region 'jnb', building from the Dockerfile with NEXT_PUBLIC_API_URL and 2026 semester date build arguments, serving an http_service on internal port 3000 with force_https on a shared-cpu-1x 512mb VM.

- `frontend/fly.toml` L1-L42 @2d7635d88794bb1073bb54eae64a4a98122b8f87

### `research.frontend.5ac18761`

frontend/.dockerignore excludes node_modules, .next, coverage, IDE files, environment files, logs, and git metadata from the Docker build context.

- `frontend/.dockerignore` L1-L33 @a36c5495c480d39a05c31b8e78df799930b260ee

### `research.frontend.bf3179e8`

frontend/.gitignore excludes node_modules, .next, out, build, coverage, environment files, and TypeScript build info from version control.

- `frontend/.gitignore` L1-L42 @5ef6a520780202a1d6addd833d800ccb1ecac0bb

### `research.frontend.fde1b1b5`

frontend/package-lock.json is the npm lockfile (lockfileVersion 3) recording the resolved dependency tree for the frontend package.

- `frontend/package-lock.json` L1-L20 @6cc5d58f2c0fc6055992468c70d8f7ffe2e6e3da

### `research.frontend.d63ba81e`

frontend/README.md is the standard create-next-app README describing how to run the development server and deploy the app on Vercel.

- `frontend/README.md` L1-L37 @e215bc4ccf138bbc38ad58ad57e92135484b3c0f

### `research.frontend.6249cf22`

frontend/vitest.config.ts configures Vitest with the React plugin, the jsdom environment, global test APIs, a setup file at ./src/test/setup.ts, and a path alias '@' resolving to './src'.

- `frontend/vitest.config.ts` L1-L19 @ead15e2aa71542cbe1f0245e942994b5f7164ac2

## Open questions

None.
