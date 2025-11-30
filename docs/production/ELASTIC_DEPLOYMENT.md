# Elastic Deployment Guide

**Document Version**: 1.0  
**Last Updated**: 2024-11-30  
**Purpose**: Cost-effective auto-scaling for seasonal traffic patterns

## Overview

The UP Schedule Generator has a highly seasonal usage pattern:
- **Peak**: Start of semester (2-4 weeks) - thousands of users
- **Off-peak**: During semester (12+ weeks) - minimal usage
- **Idle**: Semester breaks (4+ weeks) - near zero usage

This guide provides strategies to minimize hosting costs during low-usage periods while maintaining performance during peaks.

---

## Cost Analysis: Traditional vs Elastic

### Traditional Always-On Hosting

```
Medium Scale Server (4 CPU, 16GB RAM):
- Peak usage: 2 weeks × $400/month = $200
- Normal usage: 12 weeks × $400/month = $1,200
- Idle: 4 weeks × $400/month = $400
Total per semester: $1,800

Annual cost: ~$3,600
Utilization: ~15% average
Waste: ~$3,000/year on idle resources
```

### Elastic Hosting (Scale-to-Zero)

```
Pay-per-use pricing:
- Peak usage: 2 weeks × $400/month = $200
- Normal usage: 12 weeks × $50/month = $150
- Idle: 4 weeks × $5/month = $5
Total per semester: $355

Annual cost: ~$710
Savings: ~$2,890/year (80% reduction)
```

---

## Option 1: AWS Fargate (Recommended)

**Best for**: Simplicity, no Kubernetes required, true scale-to-zero

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AWS Application Load Balancer        │
│                  (Auto-scaling, Health Checks)          │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │    │   Backend    │    │  PDF Worker  │
│ ECS Fargate  │    │ ECS Fargate  │    │ ECS Fargate  │
│ 0-10 tasks   │    │ 0-20 tasks   │    │ 0-50 tasks   │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌──────────┐      ┌──────────┐     ┌──────────┐
   │   RDS    │      │ElastiCache│    │    S3    │
   │(Aurora   │      │  Redis    │    │ (MinIO   │
   │Serverless│      │(Serverless│    │replacement│
   └──────────┘      └──────────┘     └──────────┘
```

### Setup Steps

#### 1. Install AWS CLI and Configure

```bash
# Install AWS CLI
brew install awscli  # macOS
# or: curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# Configure credentials
aws configure
# AWS Access Key ID: [your-key]
# AWS Secret Access Key: [your-secret]
# Default region: us-east-1
# Default output format: json
```

#### 2. Create ECR Repositories

```bash
# Create repositories for each service
aws ecr create-repository --repository-name schedgen/frontend
aws ecr create-repository --repository-name schedgen/backend
aws ecr create-repository --repository-name schedgen/pdf-worker

# Get login credentials
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

#### 3. Build and Push Images

```bash
# Build images
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Tag images
docker tag schedgen-frontend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/schedgen/frontend:latest
docker tag schedgen-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/schedgen/backend:latest
docker tag schedgen-pdf-worker:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/schedgen/pdf-worker:latest

# Push images
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/schedgen/frontend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/schedgen/backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/schedgen/pdf-worker:latest
```

#### 4. Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name schedgen-cluster --capacity-providers FARGATE FARGATE_SPOT

# Create VPC and networking (or use default VPC)
# Note: In production, create custom VPC with private subnets
```

#### 5. Create Task Definitions

```json
// backend-task-definition.json
{
  "family": "schedgen-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/schedgen/backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3001"}
      ],
      "secrets": [
        {"name": "SESSION_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:schedgen/session-secret"},
        {"name": "POSTGRES_PASSWORD", "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:schedgen/db-password"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/schedgen-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

```bash
# Register task definitions
aws ecs register-task-definition --cli-input-json file://backend-task-definition.json
aws ecs register-task-definition --cli-input-json file://frontend-task-definition.json
aws ecs register-task-definition --cli-input-json file://pdf-worker-task-definition.json
```

#### 6. Create Services with Auto-Scaling

```bash
# Create backend service
aws ecs create-service \
  --cluster schedgen-cluster \
  --service-name schedgen-backend \
  --task-definition schedgen-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=3001"

# Configure auto-scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/schedgen-cluster/schedgen-backend \
  --min-capacity 0 \
  --max-capacity 20

# Scale based on CPU
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/schedgen-cluster/schedgen-backend \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

```json
// scaling-policy.json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

#### 7. Configure Aurora Serverless for Database

```bash
# Create Aurora Serverless v2 cluster
aws rds create-db-cluster \
  --db-cluster-identifier schedgen-db \
  --engine aurora-postgresql \
  --engine-version 15.3 \
  --master-username postgres \
  --master-user-password YOUR_PASSWORD \
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=4 \
  --enable-http-endpoint

# Aurora Serverless v2 scales from 0.5 ACU to 4 ACU
# Cost: ~$0.12/hour when active, ~$0.06/hour when idle
```

#### 8. Configure ElastiCache Serverless for Redis

```bash
# Create ElastiCache Serverless
aws elasticache create-serverless-cache \
  --serverless-cache-name schedgen-redis \
  --engine redis \
  --serverless-cache-configuration MaximumDataStorage=5,MaximumECPUPerSecond=5000
```

### Cost Breakdown (AWS Fargate)

**Peak Period (2 weeks, 1000 concurrent users):**
```
Fargate Tasks:
- Frontend: 5 tasks × 0.5 vCPU × $0.04/hour × 336 hours = $33.60
- Backend: 10 tasks × 0.5 vCPU × $0.04/hour × 336 hours = $67.20
- PDF Worker: 20 tasks × 1 vCPU × $0.04/hour × 336 hours = $268.80

Aurora Serverless: 4 ACU × $0.12/hour × 336 hours = $161.28
ElastiCache: 5000 ECPU × $0.034/million × 336 hours = $57.12
S3: 100GB × $0.023/GB = $2.30
ALB: $0.0225/hour × 336 hours = $7.56

Total: ~$598/2 weeks = $299/week
```

**Normal Period (12 weeks, 50 concurrent users):**
```
Fargate Tasks:
- Frontend: 1 task × 0.5 vCPU × $0.04/hour × 2016 hours = $40.32
- Backend: 2 tasks × 0.5 vCPU × $0.04/hour × 2016 hours = $80.64
- PDF Worker: 2 tasks × 1 vCPU × $0.04/hour × 2016 hours = $161.28

Aurora Serverless: 0.5 ACU × $0.06/hour × 2016 hours = $60.48
ElastiCache: 500 ECPU × $0.034/million × 2016 hours = $34.27
S3: 50GB × $0.023/GB = $1.15
ALB: $0.0225/hour × 2016 hours = $45.36

Total: ~$423/12 weeks = $35/week
```

**Idle Period (4 weeks, near zero users):**
```
Fargate Tasks: 0 tasks = $0
Aurora Serverless: 0.5 ACU × $0.06/hour × 672 hours = $20.16
ElastiCache: Paused = $0
S3: 10GB × $0.023/GB = $0.23
ALB: $0.0225/hour × 672 hours = $15.12

Total: ~$36/4 weeks = $9/week
```

**Semester Total**: $598 + $423 + $36 = **$1,057**  
**Annual Total**: ~**$2,114** (vs $3,600 always-on)

---

## Option 2: Google Cloud Run (Simplest)

**Best for**: Maximum simplicity, true scale-to-zero, minimal configuration

### Why Cloud Run?

- **True scale-to-zero**: Pay only when requests are being processed
- **No cluster management**: Fully managed, no ECS/Fargate complexity
- **Automatic HTTPS**: Built-in SSL certificates
- **Simple deployment**: `gcloud run deploy` and done
- **Cost-effective**: $0.00002400/vCPU-second, $0.00000250/GiB-second

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Cloud Load Balancer (HTTPS)                │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │    │   Backend    │    │  PDF Worker  │
│  Cloud Run   │    │  Cloud Run   │    │  Cloud Run   │
│  0-100 inst  │    │  0-100 inst  │    │  0-1000 inst │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌──────────┐      ┌──────────┐     ┌──────────┐
   │Cloud SQL │      │ Memorystore│   │   GCS    │
   │(Postgres)│      │   Redis    │   │(Storage) │
   └──────────┘      └──────────┘     └──────────┘
```

### Setup Steps

#### 1. Install Google Cloud SDK

```bash
# macOS
brew install --cask google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash

# Initialize
gcloud init
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

#### 2. Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

#### 3. Create Artifact Registry

```bash
# Create Docker repository
gcloud artifacts repositories create schedgen \
  --repository-format=docker \
  --location=us-central1 \
  --description="UP Schedule Generator images"

# Configure Docker
gcloud auth configure-docker us-central1-docker.pkg.dev
```

#### 4. Build and Push Images

```bash
# Build images
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Tag for Artifact Registry
docker tag schedgen-frontend:latest us-central1-docker.pkg.dev/YOUR_PROJECT/schedgen/frontend:latest
docker tag schedgen-backend:latest us-central1-docker.pkg.dev/YOUR_PROJECT/schedgen/backend:latest
docker tag schedgen-pdf-worker:latest us-central1-docker.pkg.dev/YOUR_PROJECT/schedgen/pdf-worker:latest

# Push
docker push us-central1-docker.pkg.dev/YOUR_PROJECT/schedgen/frontend:latest
docker push us-central1-docker.pkg.dev/YOUR_PROJECT/schedgen/backend:latest
docker push us-central1-docker.pkg.dev/YOUR_PROJECT/schedgen/pdf-worker:latest
```

#### 5. Create Cloud SQL Instance

```bash
# Create PostgreSQL instance
gcloud sql instances create schedgen-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --enable-bin-log \
  --backup-start-time=03:00

# Create database
gcloud sql databases create schedgen --instance=schedgen-db

# Create user
gcloud sql users create schedgen \
  --instance=schedgen-db \
  --password=YOUR_PASSWORD
```

#### 6. Deploy Services to Cloud Run

```bash
# Deploy backend
gcloud run deploy schedgen-backend \
  --image=us-central1-docker.pkg.dev/YOUR_PROJECT/schedgen/backend:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=100 \
  --cpu=1 \
  --memory=1Gi \
  --timeout=300 \
  --concurrency=80 \
  --set-env-vars="NODE_ENV=production,PORT=3001" \
  --set-secrets="SESSION_SECRET=schedgen-session-secret:latest,POSTGRES_PASSWORD=schedgen-db-password:latest" \
  --add-cloudsql-instances=YOUR_PROJECT:us-central1:schedgen-db

# Deploy frontend
gcloud run deploy schedgen-frontend \
  --image=us-central1-docker.pkg.dev/YOUR_PROJECT/schedgen/frontend:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=50 \
  --cpu=1 \
  --memory=512Mi \
  --set-env-vars="NEXT_PUBLIC_API_URL=https://schedgen-backend-xxx.run.app"

# Deploy PDF worker
gcloud run deploy schedgen-pdf-worker \
  --image=us-central1-docker.pkg.dev/YOUR_PROJECT/schedgen/pdf-worker:latest \
  --platform=managed \
  --region=us-central1 \
  --no-allow-unauthenticated \
  --min-instances=0 \
  --max-instances=1000 \
  --cpu=2 \
  --memory=2Gi \
  --timeout=300 \
  --concurrency=4
```

#### 7. Configure Auto-Scaling

Cloud Run auto-scales automatically, but you can tune it:

```bash
# Update backend with custom scaling
gcloud run services update schedgen-backend \
  --min-instances=0 \
  --max-instances=100 \
  --cpu-throttling \
  --cpu-boost \
  --execution-environment=gen2
```

### Cost Breakdown (Google Cloud Run)

**Peak Period (2 weeks, 1000 concurrent users):**
```
Cloud Run:
- Frontend: 50 instances × 1 vCPU × $0.00002400/vCPU-sec × 1,209,600 sec = $1,451.52
- Backend: 100 instances × 1 vCPU × $0.00002400/vCPU-sec × 1,209,600 sec = $2,903.04
- PDF Worker: 200 instances × 2 vCPU × $0.00002400/vCPU-sec × 604,800 sec = $2,902.08

Cloud SQL: db-n1-standard-2 × $0.0965/hour × 336 hours = $32.42
Memorystore: 5GB × $0.049/GB/hour × 336 hours = $82.32
Cloud Storage: 100GB × $0.020/GB = $2.00

Total: ~$7,373/2 weeks (Note: This is high due to continuous load)
```

**Wait, that's expensive!** Cloud Run charges per request, so continuous high load is costly. Better for:

**Actual Usage Pattern (Bursty Traffic):**
```
Peak Period (2 weeks, 10,000 requests/day):
- Requests: 140,000 requests × $0.40/million = $0.056
- CPU time: 140,000 × 2 sec × $0.00002400/vCPU-sec = $6.72
- Memory: 140,000 × 2 sec × 1GB × $0.00000250/GiB-sec = $0.70

Cloud SQL: $32.42
Memorystore: $82.32
Storage: $2.00

Total: ~$124/2 weeks = $62/week
```

**Normal Period (12 weeks, 1,000 requests/day):**
```
Requests: 84,000 × $0.40/million = $0.034
CPU/Memory: ~$5.00
Cloud SQL: $194.52
Memorystore: $493.92
Storage: $1.00

Total: ~$695/12 weeks = $58/week
```

**Idle Period (4 weeks, 10 requests/day):**
```
Requests: 280 × $0.40/million = $0.0001
CPU/Memory: ~$0.05
Cloud SQL: $64.84 (can pause)
Memorystore: $164.64 (can delete)
Storage: $0.20

Total: ~$65/4 weeks = $16/week (or $1/week if paused)
```

**Semester Total**: $124 + $695 + $65 = **$884**  
**Annual Total**: ~**$1,768**

---

## Option 3: Fly.io (Developer-Friendly)

**Best for**: Simplicity, global edge deployment, generous free tier

### Why Fly.io?

- **Scale-to-zero**: Automatic with `min_machines_running = 0`
- **Simple deployment**: `fly deploy` and done
- **Global edge**: Deploy close to users
- **Generous free tier**: 3 shared-cpu VMs free
- **Built-in Postgres**: Managed Postgres included

### Setup

```bash
# Install flyctl
brew install flyctl  # macOS
# or: curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Initialize app
fly launch --name schedgen-backend --region jnb  # Johannesburg for UP students
```

```toml
# fly.toml
app = "schedgen-backend"
primary_region = "jnb"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3001"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[services.ports]]
  port = 80
  handlers = ["http"]

[[services.ports]]
  port = 443
  handlers = ["tls", "http"]

[services.concurrency]
  type = "connections"
  hard_limit = 100
  soft_limit = 80

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 1024
```

```bash
# Deploy
fly deploy

# Scale PDF workers
fly scale count 0 --max-per-region 50

# Create Postgres
fly postgres create --name schedgen-db --region jnb
fly postgres attach schedgen-db

# Create Redis
fly redis create --name schedgen-redis --region jnb
```

### Cost Breakdown (Fly.io)

**Peak Period:**
```
Machines: 20 × $0.0000008/sec × 1,209,600 sec = $19.35
Postgres: $15/month
Redis: $10/month
Storage: 100GB × $0.15/GB = $15

Total: ~$60/2 weeks
```

**Normal Period:**
```
Machines: 3 × free tier = $0
Postgres: $15/month × 3 = $45
Redis: $10/month × 3 = $30
Storage: $15

Total: ~$90/12 weeks
```

**Idle Period:**
```
Machines: 0 = $0
Postgres: $15/month = $15
Redis: Can pause = $0
Storage: $5

Total: ~$20/4 weeks
```

**Semester Total**: $60 + $90 + $20 = **$170**  
**Annual Total**: ~**$340** (Cheapest option!)

---

## Comparison Matrix

| Feature | AWS Fargate | Google Cloud Run | Fly.io |
|---------|-------------|------------------|--------|
| **Complexity** | Medium | Low | Very Low |
| **Scale-to-Zero** | Yes (min 0) | Yes (true) | Yes (true) |
| **Setup Time** | 2-3 hours | 1-2 hours | 30 minutes |
| **Semester Cost** | ~$1,057 | ~$884 | ~$170 |
| **Annual Cost** | ~$2,114 | ~$1,768 | ~$340 |
| **Free Tier** | Limited | $300 credit | 3 VMs free |
| **Global Edge** | Via CloudFront | Via CDN | Built-in |
| **Managed DB** | Aurora Serverless | Cloud SQL | Fly Postgres |
| **Best For** | Enterprise | Google ecosystem | Startups |

---

## Recommendation

### For Your Use Case: **Fly.io**

**Reasons**:
1. **Lowest cost**: $340/year vs $2,114 (AWS) or $1,768 (GCP)
2. **Simplest setup**: Deploy in 30 minutes
3. **True scale-to-zero**: No charges when idle
4. **South Africa region**: Johannesburg datacenter for low latency to UP students
5. **Free tier**: 3 VMs free covers normal usage
6. **No Kubernetes**: Simple `fly.toml` configuration

### Implementation Plan

**Week 1: Setup**
```bash
# Day 1: Create Fly.io account and deploy backend
fly launch --name schedgen-backend

# Day 2: Deploy frontend and PDF worker
fly launch --name schedgen-frontend
fly launch --name schedgen-pdf-worker

# Day 3: Setup databases
fly postgres create --name schedgen-db
fly redis create --name schedgen-redis

# Day 4: Configure auto-scaling
# Edit fly.toml with min_machines_running = 0

# Day 5: Test and monitor
fly logs
fly status
```

**Week 2: Optimization**
- Configure auto-scaling thresholds
- Set up monitoring alerts
- Test scale-up/scale-down behavior
- Document deployment process

### Alternative: AWS Fargate (If you need enterprise features)

Use Fargate if you need:
- Advanced networking (VPC, private subnets)
- Compliance requirements (HIPAA, SOC 2)
- Integration with other AWS services
- Enterprise support

---

## Migration from Docker Compose

### Step 1: Update Environment Variables

```bash
# Create .env.fly
cp .env .env.fly

# Update URLs for Fly.io
FRONTEND_URL=https://schedgen-frontend.fly.dev
BACKEND_URL=https://schedgen-backend.fly.dev
POSTGRES_HOST=schedgen-db.internal
REDIS_HOST=schedgen-redis.internal
```

### Step 2: Create fly.toml for Each Service

See examples above for backend. Repeat for frontend and PDF worker.

### Step 3: Deploy

```bash
# Deploy all services
cd backend && fly deploy
cd ../frontend && fly deploy
cd ../pdf-worker && fly deploy
```

### Step 4: Configure Secrets

```bash
# Set secrets
fly secrets set SESSION_SECRET=$(openssl rand -base64 32)
fly secrets set POSTGRES_PASSWORD=$(openssl rand -base64 32)
fly secrets set GOOGLE_CLIENT_ID=your-client-id
fly secrets set GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## Monitoring and Alerts

### Fly.io Monitoring

```bash
# View logs
fly logs

# Check status
fly status

# Monitor metrics
fly dashboard
```

### Set Up Alerts

```bash
# Install Fly.io CLI monitoring
fly monitor --app schedgen-backend

# Configure alerts (via dashboard)
# - CPU > 80%
# - Memory > 90%
# - Response time > 5s
# - Error rate > 5%
```

---

## Cost Optimization Tips

### 1. Aggressive Scale-Down

```toml
[http_service]
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  
  # Stop after 5 minutes of inactivity
  [http_service.auto_stop_machines]
    enabled = true
    min_machines_running = 0
```

### 2. Use Spot Instances (AWS)

```bash
# Use FARGATE_SPOT for 70% cost savings
aws ecs create-service \
  --capacity-provider-strategy capacityProvider=FARGATE_SPOT,weight=1
```

### 3. Pause Databases During Breaks

```bash
# Fly.io: Pause Postgres during semester breaks
fly postgres pause schedgen-db

# Resume when needed
fly postgres resume schedgen-db
```

### 4. Use CDN for Static Assets

```bash
# CloudFlare (free tier)
# - Cache frontend assets
# - Reduce origin requests
# - Save bandwidth costs
```

### 5. Implement Request Batching

```typescript
// Batch status checks to reduce requests
const batchStatusCheck = async (jobIds: string[]) => {
  return fetch('/api/jobs/batch', {
    method: 'POST',
    body: JSON.stringify({ jobIds }),
  });
};
```

---

## Related Documents

- [Scalability Assessment](./SCALABILITY_ASSESSMENT.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [Deployment Guide](../../DEPLOYMENT.md)
