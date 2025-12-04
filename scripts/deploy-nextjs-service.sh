#!/bin/bash
# Deploy Next.js App to Google Cloud Run
# Usage: ./scripts/deploy-nextjs-service.sh [PROJECT_ID] [REGION] [ML_SERVICE_URL]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${1:-${GOOGLE_CLOUD_PROJECT:-""}}
REGION=${2:-"us-central1"}
ML_SERVICE_URL=${3:-${ML_SERVICE_URL:-""}}
SERVICE_NAME="nextjs-app"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

# Validate project ID
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: PROJECT_ID is required${NC}"
    echo "Usage: $0 [PROJECT_ID] [REGION] [ML_SERVICE_URL]"
    echo "Or set GOOGLE_CLOUD_PROJECT environment variable"
    exit 1
fi

# Load environment variables from .env.local if it exists
ENV_FILE="$(dirname "$0")/../.env.local"
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}📝 Loading environment variables from .env.local${NC}"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Validate required Firebase environment variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    "NEXT_PUBLIC_FIREBASE_APP_ID"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Please set these in .env.local or as environment variables"
    exit 1
fi

echo -e "${GREEN}🚀 Deploying Next.js App to Cloud Run${NC}"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.." || exit 1

# Build arguments for Docker
BUILD_ARGS=(
    "--build-arg=NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}"
    "--build-arg=NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}"
    "--build-arg=NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
    "--build-arg=NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}"
    "--build-arg=NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}"
    "--build-arg=NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}"
)

# Add measurement ID if provided
if [ -n "$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" ]; then
    BUILD_ARGS+=("--build-arg=NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}")
fi

echo -e "${YELLOW}📦 Building Docker image with build args...${NC}"
gcloud builds submit \
    --tag "$IMAGE_NAME" \
    --project "$PROJECT_ID" \
    "${BUILD_ARGS[@]}" \
    --quiet

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Prepare environment variables for Cloud Run
ENV_VARS=()
if [ -n "$ML_SERVICE_URL" ]; then
    ENV_VARS+=("--set-env-vars=ML_SERVICE_URL=${ML_SERVICE_URL}")
fi

echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
DEPLOY_CMD=(
    gcloud run deploy "$SERVICE_NAME"
    --image "$IMAGE_NAME"
    --platform managed
    --region "$REGION"
    --project "$PROJECT_ID"
    --memory 512Mi
    --cpu 1
    --port 8080
    --min-instances 0
    --max-instances 10
    --timeout 300
    --allow-unauthenticated
    "${ENV_VARS[@]}"
    --quiet
)

"${DEPLOY_CMD[@]}"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --platform managed \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --format 'value(status.url)')

echo ""
echo -e "${GREEN}✅ Next.js App deployed successfully!${NC}"
echo -e "${GREEN}📍 Service URL: $SERVICE_URL${NC}"
echo ""
