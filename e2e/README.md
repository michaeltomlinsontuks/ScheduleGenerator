# End-to-End Testing

This directory contains end-to-end tests for the UP Schedule Generator using Playwright.

## Setup

1. Install dependencies:
```bash
cd e2e
npm install
npx playwright install
```

2. Ensure Docker services are running:
```bash
cd ..
docker compose up -d
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run specific browser tests
```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
npm run test:mobile
```

### View test report
```bash
npm run report
```

## Test Structure

- `tests/homepage.spec.ts` - Homepage functionality tests
- `tests/upload.spec.ts` - File upload and validation tests
- `tests/api.spec.ts` - Backend API health and endpoint tests
- `tests/integration.spec.ts` - Full user journey and error handling tests

## Writing Tests

Use Playwright's codegen to generate test code:
```bash
npm run codegen
```

This will open a browser where you can interact with your app, and Playwright will generate the test code for you.

## CI/CD Integration

Tests are configured to run in CI environments with:
- Automatic retries (2 retries in CI)
- HTML, JSON, and list reporters
- Screenshots on failure
- Video recording on failure
- Trace collection on first retry

## Test Coverage

Current test coverage includes:
- ✅ Homepage rendering and navigation
- ✅ Upload page functionality
- ✅ File upload validation
- ✅ Backend health checks
- ✅ PDF worker health checks
- ✅ Full user journey (upload to calendar generation)
- ✅ Error handling (network errors, invalid files)
- ✅ Mobile responsiveness

## Troubleshooting

### Services not running
Ensure all Docker services are up:
```bash
docker compose ps
```

### Port conflicts
Check if ports 3000, 3001, and 5001 are available:
```bash
lsof -i :3000
lsof -i :3001
lsof -i :5001
```

### Test failures
1. Check the HTML report: `npm run report`
2. Look at screenshots in `test-results/`
3. Watch videos in `test-results/`
4. Run in headed mode to see what's happening: `npm run test:headed`
