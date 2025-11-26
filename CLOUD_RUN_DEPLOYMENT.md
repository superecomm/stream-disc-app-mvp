# Google Cloud Run Deployment Guide

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed: https://cloud.google.com/sdk/docs/install
3. **Docker** installed (for building images)
4. **Project setup** in Google Cloud Console

## Step 1: Install & Setup gcloud CLI

```bash
# Install gcloud CLI (if not installed)
# Download from: https://cloud.google.com/sdk/docs/install

# Initialize and login
gcloud init
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

## Step 2: Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Use Node.js 18 Alpine for smaller image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variable for build
ENV NEXT_TELEMETRY_DISABLED 1

# Build Next.js app
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Cloud Run will set PORT environment variable
EXPOSE 8080
ENV PORT 8080

CMD ["node", "server.js"]
```

## Step 3: Update next.config.ts for Standalone Output

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

## Step 4: Create .dockerignore

Create `.dockerignore` in project root:

```
node_modules
.next
.git
.gitignore
.env.local
.env*.local
*.md
.vercel
.cursor
.vscode
functions
services/viim-ml
*.log
```

## Step 5: Build and Deploy

### Option A: Using Cloud Build (Recommended)

```bash
# Set your project ID
export PROJECT_ID=YOUR_PROJECT_ID

# Build and deploy in one command
gcloud run deploy stream-disc-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production"
```

### Option B: Manual Docker Build + Push

```bash
# Set variables
export PROJECT_ID=YOUR_PROJECT_ID
export SERVICE_NAME=stream-disc-app
export REGION=us-central1

# Build Docker image
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME .

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated
```

## Step 6: Set Environment Variables

```bash
# Set Firebase environment variables
gcloud run services update stream-disc-app \
  --region us-central1 \
  --update-env-vars \
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key,\
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com,\
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id,\
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com,\
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id,\
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id,\
FIREBASE_PROJECT_ID=your_project_id,\
FIREBASE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com

# Set Firebase private key (use secret for this)
gcloud secrets create firebase-private-key --data-file=private-key.txt

gcloud run services update stream-disc-app \
  --region us-central1 \
  --update-secrets FIREBASE_PRIVATE_KEY=firebase-private-key:latest
```

## Step 7: Deploy ML Service to Cloud Run

```bash
# Navigate to ML service
cd services/viim-ml

# Deploy ML service
gcloud run deploy viim-ml-service \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300

# Get the ML service URL
export ML_SERVICE_URL=$(gcloud run services describe viim-ml-service \
  --region us-central1 \
  --format 'value(status.url)')

# Update main app with ML service URL
gcloud run services update stream-disc-app \
  --region us-central1 \
  --update-env-vars NEXT_PUBLIC_ML_SERVICE_URL=$ML_SERVICE_URL
```

## Step 8: Setup Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service stream-disc-app \
  --domain your-domain.com \
  --region us-central1
```

## Step 9: Setup CI/CD with Cloud Build

Create `cloudbuild.yaml`:

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/stream-disc-app', '.']
  
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/stream-disc-app']
  
  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'stream-disc-app'
      - '--image'
      - 'gcr.io/$PROJECT_ID/stream-disc-app'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/stream-disc-app'
```

## Monitoring & Logs

```bash
# View logs
gcloud run services logs tail stream-disc-app --region us-central1

# View service details
gcloud run services describe stream-disc-app --region us-central1

# List all Cloud Run services
gcloud run services list
```

## Cost Optimization

Cloud Run pricing is based on:
- **CPU**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GiB-second  
- **Requests**: $0.40 per million requests
- **Free tier**: 2 million requests/month

Tips:
1. Set min instances to 0 (scale to zero)
2. Use CPU allocation "only during request processing"
3. Set appropriate memory limits (512MB-1GB for Next.js)
4. Enable concurrency (80-100 requests per instance)

```bash
# Optimize for cost
gcloud run services update stream-disc-app \
  --region us-central1 \
  --min-instances 0 \
  --max-instances 10 \
  --cpu 1 \
  --memory 512Mi \
  --concurrency 80 \
  --cpu-throttling
```

## Comparison: Deployment Time

**Vercel**: 5 minutes (fastest)
**Cloud Run**: 15-30 minutes (first time setup)

## Next Steps After Deployment

1. Test the deployed app
2. Monitor logs and errors
3. Set up alerts in Google Cloud Console
4. Configure scaling based on traffic
5. Deploy ML service to Cloud Run
6. Setup Cloud CDN for static assets (optional)

---

**Ready to deploy?** Let me know and I'll help you through each step!

