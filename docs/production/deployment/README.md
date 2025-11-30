# Deployment Guide

Complete guide for deploying UP Schedule Generator to production.

```mermaid
flowchart TD
    A[Start] --> B[Prerequisites]
    B --> C[Initial Setup]
    C --> D[Configuration]
    D --> E[Deploy Services]
    E --> F[Verification]
    F --> G{All Checks Pass?}
    G -->|Yes| H[Production Ready]
    G -->|No| I[Troubleshoot]
    I --> F
```

## Overview

This guide covers deploying the application from scratch. For updates, see [Rolling Updates](./rolling-updates.md).

## Deployment Steps

### 1. Prerequisites
[View Prerequisites Guide](./prerequisites.md)

- Server requirements (4 CPU, 16GB RAM recommended)
- Docker & Docker Compose installed
- Domain with DNS configured
- Google OAuth credentials

### 2. Initial Setup
[View Initial Setup Guide](./initial-setup.md)

- Clone repository
- Configure firewall
- Set up SSL certificates
- Initialize storage

### 3. Configuration
[View Configuration Guide](./configuration.md)

- Environment variables
- Service configuration
- Security settings
- Database setup

### 4. Deploy Services
[View Deployment Steps](./deploy-services.md)

- Build Docker images
- Start infrastructure services
- Run database migrations
- Start application services

### 5. Verification
[View Verification Guide](./verification.md)

- Health checks
- Service connectivity
- SSL certificate validation
- Application testing

## Quick Deploy

For experienced users:

```bash
# 1. Clone and configure
git clone <repo-url>
cd ScheduleGenerator
cp .env.example .env
nano .env  # Configure all variables

# 2. Deploy
./scripts/deploy.sh

# 3. Verify
./scripts/verify-deployment.sh
```

## Architecture

```mermaid
graph TB
    subgraph External
        U[Users]
        L[Let's Encrypt]
    end
    
    subgraph Server
        T[Traefik :80/:443]
        F[Frontend :3000]
        B[Backend :3001]
        W[PDF Worker :5001]
        
        P[(PostgreSQL)]
        R[(Redis)]
        M[MinIO]
    end
    
    U -->|HTTPS| T
    L -->|TLS Cert| T
    T --> F
    T --> B
    B --> W
    B --> P
    B --> R
    B --> M
```

## Deployment Options

### Standard Deployment
- Single server
- Docker Compose
- Suitable for 500-2000 users
- Cost: $320-600/month

### High Availability
- Multi-server cluster
- Load balancing
- Database replication
- Suitable for 2000+ users
- Cost: $1600+/month

See [Scalability Assessment](../SCALABILITY_ASSESSMENT.md)

## Related Guides

- [Rolling Updates](./rolling-updates.md) - Update existing deployment
- [Rollback Procedures](../rollback/README.md) - Rollback failed deployment
- [Backup Before Deploy](../backup/pre-deployment.md) - Pre-deployment backup
- [Troubleshooting](../troubleshooting/deployment-issues.md) - Common issues

## Support

- Check [Verification Guide](./verification.md) for health checks
- See [Troubleshooting](../troubleshooting/deployment-issues.md) for common issues
- Review [Production Checklist](../PRODUCTION_CHECKLIST.md) for completeness
