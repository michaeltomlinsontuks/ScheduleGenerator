# Production CORS and Migration Fixes

## Issues Fixed

### 1. CORS Configuration Issue
**Problem**: The backend was configured to allow `https://localhost` but the frontend was running on `http://localhost:3000`, causing CORS errors.

**Root Cause**: The `docker-compose.prod.yml` override file was setting `FRONTEND_URL=https://${DOMAIN}` which evaluated to `https://localhost` for local testing, but the actual frontend was accessible at `http://localhost:3000`.

**Solution**: Modified `scripts/test-prod-local.sh` to use only the base `docker-compose.yml` file for local testing by setting `USE_PROD_OVERRIDE=false`. The base compose file correctly uses `FRONTEND_URL=${FRONTEND_URL}` which picks up the value from `.env.prod.local` (`http://localhost:3000`).

### 2. Database Migration Failure
**Problem**: Migrations were failing with error: `Cannot find module '/app/src/data-source-cli.ts'`

**Root Cause**: 
- The migration command was using `ts-node` to run TypeScript source files
- In production Docker image, only the compiled `dist/` folder is copied
- The `src/` folder doesn't exist in the production container
- `tsconfig-paths` and `ts-node` were in devDependencies but needed for migrations

**Solution**:
1. Moved `ts-node` and `tsconfig-paths` from devDependencies to dependencies in `backend/package.json`
2. Added new npm script `migration:run:prod` that uses compiled JavaScript files:
   ```json
   "typeorm:prod": "node ./node_modules/typeorm/cli.js",
   "migration:run:prod": "npm run typeorm:prod -- migration:run -d dist/data-source-cli.js"
   ```
3. Updated test script to use `migration:run:prod` instead of `migration:run`

## Files Modified

### 1. `scripts/test-prod-local.sh`
- Added `USE_PROD_OVERRIDE=false` flag to control which compose files are used
- Updated all docker compose commands to conditionally use prod override
- Changed migration command from `migration:run` to `migration:run:prod`

### 2. `backend/package.json`
- Moved `ts-node` and `tsconfig-paths` from devDependencies to dependencies
- Added `typeorm:prod` script for running TypeORM CLI with node (not ts-node)
- Added `migration:run:prod` script for production migrations using compiled JS

## Testing

### Verify CORS is working:
```bash
# Test OPTIONS preflight request
curl -I -X OPTIONS http://localhost:3001/api/upload \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"

# Should return:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
```

### Verify migrations work:
```bash
# Run migrations in production container
docker compose run --rm backend npm run migration:run:prod

# Should output:
# query: SELECT version()
# query: CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
# No migrations are pending (or list of applied migrations)
```

### Full production test:
```bash
./scripts/test-prod-local.sh
```

## Production Deployment Notes

For actual production deployment (not local testing):

1. **Use both compose files**: The production override (`docker-compose.prod.yml`) is designed for real production with Traefik, TLS, and proper domain names:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

2. **Environment variables**: Ensure `.env` file has:
   - `DOMAIN=your-domain.com`
   - `FRONTEND_URL=https://your-domain.com`
   - `BACKEND_URL=https://api.your-domain.com`

3. **Migrations**: Always run migrations before starting application services:
   ```bash
   docker compose run --rm backend npm run migration:run:prod
   docker compose up -d backend frontend
   ```

## Local Testing vs Production

| Aspect | Local Testing | Production |
|--------|--------------|------------|
| Compose Files | `docker-compose.yml` only | Both files |
| Frontend URL | `http://localhost:3000` | `https://domain.com` |
| Backend URL | `http://localhost:3001` | `https://api.domain.com` |
| TLS/SSL | No | Yes (via Traefik) |
| Traefik | Not used | Required |
| CORS Origin | `http://localhost:3000` | `https://domain.com` |

## Verification Checklist

- [x] Backend health endpoint accessible
- [x] Frontend homepage loads
- [x] CORS allows requests from frontend origin
- [x] Database migrations run successfully
- [x] All containers start and become healthy
- [x] No CORS errors in browser console
