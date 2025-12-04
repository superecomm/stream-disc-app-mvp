#!/bin/bash
# Deploy ML Service to Google Cloud Run
# Usage: ./scripts/deploy-ml-service.sh [PROJECT_ID] [REGION]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${1:-${GOOGLE_CLOUD_PROJECT:-""}}
REGION=${2:-"us-central1"}
SERVICE_NAME="viim-ml"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

# Validate project ID
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: PROJECT_ID is required${NC}"
    echo "Usage: $0 [PROJECT_ID] [REGION]"
    echo "Or set GOOGLE_CLOUD_PROJECT environment variable"
    exit 1
fi

echo -e "${GREEN}🚀 Deploying ML Service to Cloud Run${NC}"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo ""

# Navigate to ML service directory
cd "$(dirname "$0")/../services/viim-ml" || exit 1

echo -e "${YELLOW}📦 Building Docker image...${NC}"
gcloud builds submit \
    --tag "$IMAGE_NAME" \
    --project "$PROJECT_ID" \
    --quiet

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_NAME" \
    --platform managed \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --memory 2Gi \
    --cpu 2 \
    --port 8000 \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 300 \
    --allow-unauthenticated \
    --quiet

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
echo -e "${GREEN}✅ ML Service deployed successfully!${NC}"
echo -e "${GREEN}📍 Service URL: $SERVICE_URL${NC}"
echo ""
echo "To use this URL in your Next.js app, set:"
echo "  export ML_SERVICE_URL=$SERVICE_URL"
echo ""
