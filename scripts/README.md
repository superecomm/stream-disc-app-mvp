# Deployment Scripts

This directory contains scripts for deploying the application to Google Cloud Run.

## Prerequisites

1. **Google Cloud SDK** installed and configured
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Required APIs enabled**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

3. **Environment variables** set in `.env.local` (for Next.js deployment):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)

## Scripts

### `deploy-all.sh` - Deploy Everything (Recommended)

Deploys both ML service and Next.js app in sequence.

```bash
./scripts/deploy-all.sh [PROJECT_ID] [REGION]
```

**Example:**
```bash
./scripts/deploy-all.sh my-project-id us-central1
```

**Or with environment variable:**
```bash
export GOOGLE_CLOUD_PROJECT=my-project-id
./scripts/deploy-all.sh
```

### `deploy-ml-service.sh` - Deploy ML Service Only

Deploys the Python ML service to Cloud Run.

```bash
./scripts/deploy-ml-service.sh [PROJECT_ID] [REGION]
```

**Configuration:**
- Memory: 2GB
- CPU: 2 vCPU
- Port: 8000
- Min instances: 0
- Max instances: 10

### `deploy-nextjs-service.sh` - Deploy Next.js App Only

Deploys the Next.js application to Cloud Run.

```bash
./scripts/deploy-nextjs-service.sh [PROJECT_ID] [REGION] [ML_SERVICE_URL]
```

**Configuration:**
- Memory: 512MB
- CPU: 1 vCPU
- Port: 8080
- Min instances: 0
- Max instances: 10

**Note:** If `ML_SERVICE_URL` is not provided, it will try to auto-detect from the deployed ML service.

## Quick Start

1. **Set up environment:**
   ```bash
   cp env.local.example .env.local
   # Edit .env.local with your Firebase credentials
   ```

2. **Deploy everything:**
   ```bash
   ./scripts/deploy-all.sh YOUR_PROJECT_ID
   ```

3. **Verify deployment:**
   - Check Cloud Run console: https://console.cloud.google.com/run
   - Test the Next.js app URL
   - Check logs if needed

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Ensure all dependencies are in `package.json`
- Check that `npm ci` completes successfully

**Error: "Build args not found"**
- Verify `.env.local` exists and has all required variables
- Check that variables are prefixed with `NEXT_PUBLIC_` for client-side access

### Deployment Fails

**Error: "Permission denied"**
- Ensure you have Cloud Run Admin and Cloud Build Editor roles
- Run: `gcloud auth login`

**Error: "Service account not found"**
- Enable required APIs (see Prerequisites)
- Check project billing is enabled

**Error: "Image not found"**
- Ensure Cloud Build completed successfully
- Check Container Registry for the image

### Service Unhealthy

**Check logs:**
```bash
# ML Service
gcloud run services logs read viim-ml --region us-central1

# Next.js App
gcloud run services logs read nextjs-app --region us-central1
```

**Common issues:**
- Missing environment variables
- Incorrect ML_SERVICE_URL
- Port mismatch (should be 8080 for Next.js, 8000 for ML service)

## Manual Deployment

If you prefer to deploy manually:

### ML Service
```bash
cd services/viim-ml
gcloud builds submit --tag gcr.io/PROJECT_ID/viim-ml:latest
gcloud run deploy viim-ml \
  --image gcr.io/PROJECT_ID/viim-ml:latest \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --port 8000 \
  --allow-unauthenticated
```

### Next.js App
```bash
gcloud builds submit \
  --tag gcr.io/PROJECT_ID/nextjs-app:latest \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID \
  --build-arg NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

gcloud run deploy nextjs-app \
  --image gcr.io/PROJECT_ID/nextjs-app:latest \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --port 8080 \
  --set-env-vars ML_SERVICE_URL=https://viim-ml-xxx.run.app \
  --allow-unauthenticated
```

## Cost Optimization

- **Min instances: 0** - Services scale to zero when not in use
- **Max instances: 10** - Prevents runaway costs
- **Memory/CPU**: Adjusted for actual needs (can be reduced if not needed)

## Security Notes

- Services are deployed with `--allow-unauthenticated` for public access
- For production, consider adding authentication
- Firebase credentials in build args are public (NEXT_PUBLIC_*) - this is expected
- Never commit `.env.local` to git
