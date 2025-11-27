# Requirements Document

## Introduction

This document specifies the requirements for implementing Docker-based DevOps infrastructure for the UP Schedule Generator V3 web application. The system enables containerized deployment with Traefik reverse proxy, supporting both local development and production deployment on personal servers or VPS.

## Glossary

- **Docker Compose**: Tool for defining and running multi-container Docker applications
- **Traefik**: Cloud-native reverse proxy and load balancer with automatic SSL certificate management
- **MinIO**: S3-compatible object storage for PDF file uploads
- **Redis**: In-memory data store used as job queue for BullMQ
- **PostgreSQL**: Relational database for persistent data storage
- **PDF-Worker**: Python microservice that wraps the V2 PDF parser for schedule extraction
- **Let's Encrypt**: Free SSL certificate authority integrated with Traefik
- **Health Check**: Endpoint or command that verifies service availability

## Requirements

### Requirement 1: Docker Compose Infrastructure

**User Story:** As a developer, I want a Docker Compose configuration that orchestrates all services, so that I can run the entire application stack with a single command.

#### Acceptance Criteria

1. WHEN a developer runs `docker compose up` THEN the System SHALL start all required services (frontend, backend, pdf-worker, postgres, redis, minio, traefik)
2. WHEN services start THEN the System SHALL create a dedicated Docker network named `schedgen` for inter-service communication
3. WHEN services start THEN the System SHALL create persistent volumes for postgres_data, redis_data, minio_data, and traefik_certs
4. WHEN a service fails THEN the System SHALL automatically restart the service using the `unless-stopped` restart policy
5. WHEN the backend service starts THEN the System SHALL wait for postgres, redis, and minio services to be available via depends_on configuration

### Requirement 2: Development Environment

**User Story:** As a developer, I want a development-specific Docker configuration with hot-reload support, so that I can iterate quickly during development.

#### Acceptance Criteria

1. WHEN running in development mode THEN the System SHALL mount source code directories as volumes for hot-reload capability
2. WHEN running in development mode THEN the System SHALL expose services on localhost without SSL/TLS
3. WHEN running in development mode THEN the System SHALL use development Dockerfiles (Dockerfile.dev) with npm install instead of npm ci
4. WHEN the frontend source code changes THEN the System SHALL automatically rebuild via Next.js hot module replacement
5. WHEN the backend source code changes THEN the System SHALL automatically restart via NestJS watch mode

### Requirement 3: Production Environment

**User Story:** As a system administrator, I want a production-ready Docker configuration with SSL and security hardening, so that I can deploy the application securely.

#### Acceptance Criteria

1. WHEN running in production mode THEN the System SHALL use multi-stage Dockerfiles to minimize image size
2. WHEN running in production mode THEN the System SHALL enable HTTPS via Traefik with Let's Encrypt certificates
3. WHEN running in production mode THEN the System SHALL redirect all HTTP traffic to HTTPS
4. WHEN running in production mode THEN the System SHALL run application containers as non-root users
5. WHEN running in production mode THEN the System SHALL apply security headers via Traefik middleware

### Requirement 4: Traefik Reverse Proxy

**User Story:** As a system administrator, I want Traefik to handle routing and SSL termination, so that I can manage traffic to all services through a single entry point.

#### Acceptance Criteria

1. WHEN Traefik starts THEN the System SHALL listen on ports 80 (HTTP), 443 (HTTPS), and 8080 (dashboard)
2. WHEN a request arrives for the configured DOMAIN THEN the System SHALL route it to the frontend service
3. WHEN a request arrives for api.DOMAIN THEN the System SHALL route it to the backend service
4. WHEN a request arrives for minio.DOMAIN THEN the System SHALL route it to the MinIO console
5. WHEN ACME_EMAIL is configured THEN the System SHALL automatically obtain Let's Encrypt SSL certificates
6. WHEN accessing the Traefik dashboard THEN the System SHALL require basic authentication

### Requirement 5: PDF Worker Service

**User Story:** As a backend developer, I want a Python microservice that exposes the PDF parser via HTTP API, so that the NestJS backend can delegate PDF parsing.

#### Acceptance Criteria

1. WHEN the pdf-worker service starts THEN the System SHALL expose an HTTP endpoint on port 5000
2. WHEN the backend sends a PDF file to the pdf-worker THEN the System SHALL parse the PDF and return extracted schedule data as JSON
3. WHEN the pdf-worker receives an invalid PDF THEN the System SHALL return an appropriate error response with status code 400
4. WHEN running in production THEN the System SHALL use Gunicorn as the WSGI server
5. WHEN the pdf-worker container builds THEN the System SHALL install required system dependencies for pdfplumber (libpoppler-cpp-dev)

### Requirement 6: Frontend Dockerfile

**User Story:** As a DevOps engineer, I want optimized Docker images for the Next.js frontend, so that deployment is fast and resource-efficient.

#### Acceptance Criteria

1. WHEN building the frontend production image THEN the System SHALL use multi-stage builds with separate deps, builder, and runner stages
2. WHEN building the frontend production image THEN the System SHALL use Next.js standalone output mode for minimal image size
3. WHEN the frontend container runs THEN the System SHALL execute as a non-root user (nextjs:nodejs)
4. WHEN the frontend container runs THEN the System SHALL expose port 3000
5. WHEN building the frontend development image THEN the System SHALL include all dependencies and run `npm run dev`

### Requirement 7: Backend Dockerfile

**User Story:** As a DevOps engineer, I want optimized Docker images for the NestJS backend, so that deployment is fast and resource-efficient.

#### Acceptance Criteria

1. WHEN building the backend production image THEN the System SHALL use multi-stage builds with separate deps, builder, and runner stages
2. WHEN the backend container runs THEN the System SHALL execute as a non-root user
3. WHEN the backend container runs THEN the System SHALL expose port 3001
4. WHEN the backend container runs THEN the System SHALL include a health check that verifies the /health endpoint
5. WHEN building the backend development image THEN the System SHALL include all dependencies and run `npm run start:dev`

### Requirement 8: Environment Configuration

**User Story:** As a developer, I want environment variables to configure all services, so that I can deploy to different environments without code changes.

#### Acceptance Criteria

1. WHEN the application starts THEN the System SHALL read configuration from environment variables defined in .env file
2. WHEN .env.example is provided THEN the System SHALL document all required environment variables with descriptions
3. WHEN DOMAIN environment variable is set THEN the System SHALL use it for Traefik routing rules
4. WHEN database credentials are configured THEN the System SHALL use POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB variables
5. WHEN MinIO credentials are configured THEN the System SHALL use MINIO_ACCESS_KEY and MINIO_SECRET_KEY variables

### Requirement 9: Helper Scripts

**User Story:** As a system administrator, I want helper scripts for common operations, so that I can easily manage the deployment.

#### Acceptance Criteria

1. WHEN scripts/init-minio.sh runs THEN the System SHALL create the configured MinIO bucket if it does not exist
2. WHEN scripts/backup-db.sh runs THEN the System SHALL create a timestamped PostgreSQL backup and remove backups older than 7 days
3. WHEN scripts/deploy.sh runs THEN the System SHALL pull latest code, rebuild containers, run migrations, and restart services

### Requirement 10: Health Checks and Monitoring

**User Story:** As a system administrator, I want health checks for all services, so that I can monitor application health and enable automatic recovery.

#### Acceptance Criteria

1. WHEN the backend service is running THEN the System SHALL respond to health check requests at /health endpoint
2. WHEN a service health check fails THEN Docker SHALL restart the service according to the configured retry policy
3. WHEN docker stats is run THEN the System SHALL display resource usage for all containers
4. WHEN docker compose logs is run THEN the System SHALL display aggregated logs from all services
