# Backend Documentation

NestJS API server implementation details and guides.

```mermaid
graph TD
    A[Backend] --> B[Architecture]
    A --> C[Features]
    A --> D[API Reference]
    
    C --> C1[Authentication]
    C --> C2[Job Processing]
    C --> C3[File Upload]
    C --> C4[Monitoring]
    
    C1 --> C1A[Google OAuth]
    C1 --> C1B[IP Blocking]
    
    C2 --> C2A[BullMQ Queue]
    C2 --> C2B[Job Lifecycle]
    
    C3 --> C3A[Storage Quota]
    C3 --> C3B[File Retention]
    
    C4 --> C4A[Prometheus Metrics]
    C4 --> C4B[Structured Logging]
    C4 --> C4C[Health Checks]
```

## Implementation Guides

### Core Features
- [Database Connection Pool](./database-connection-pool.md) - Connection pooling configuration
- [Rate Limiting](./rate-limiting.md) - API rate limiting implementation
- [Structured Logging](./structured-logging.md) - Logging strategy and format

### Authentication & Security
- [IP Blocking](./ip-blocking.md) - IP-based access control
- [Google OAuth](./google-oauth.md) - OAuth integration details

### Storage & Files
- [Storage Quota](./storage-quota.md) - User storage limits
- [File Retention](./file-retention.md) - Automatic file cleanup

### Monitoring & Observability
- [Prometheus Metrics](./prometheus-metrics.md) - Metrics collection
- [Health Checks](./health-checks.md) - Service health monitoring

## Architecture

```mermaid
flowchart TB
    subgraph Client
        A[Frontend]
    end
    
    subgraph Backend
        B[API Gateway]
        C[Auth Module]
        D[Upload Module]
        E[Jobs Module]
        F[Metrics Module]
    end
    
    subgraph Storage
        G[(PostgreSQL)]
        H[(Redis)]
        I[MinIO]
    end
    
    subgraph Workers
        J[PDF Worker]
    end
    
    A -->|HTTP| B
    B --> C
    B --> D
    B --> E
    B --> F
    
    C --> G
    D --> G
    D --> I
    E --> H
    E --> J
    
    F -->|Metrics| K[Prometheus]
```

## Quick Reference

### API Endpoints
See [API Documentation](../API_DOCUMENTATION.md)

### Database Migrations
```bash
# Generate migration
npm run migration:generate src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### Testing
```bash
# Run all tests
npm test

# Run specific test
npm test -- upload.service.spec.ts

# Coverage
npm run test:cov
```

## Configuration

Key environment variables:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `MINIO_ENDPOINT` - Object storage
- `GOOGLE_CLIENT_ID` - OAuth credentials
- `SESSION_SECRET` - Session encryption

See [Environment Configuration](../../docs/development/environment.md)
