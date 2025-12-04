#!/bin/bash
# Deploy both ML Service and Next.js App to Google Cloud Run
# Usage: ./scripts/deploy-all.sh [PROJECT_ID] [REGION]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${1:-${GOOGLE_CLOUD_PROJECT:-""}}
REGION=${2:-"us-central1"}

# Validate project ID
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: PROJECT_ID is required${NC}"
    echo "Usage: $0 [PROJECT_ID] [REGION]"
    echo "Or set GOOGLE_CLOUD_PROJECT environment variable"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Cloud Run Deployment - ML Service + Next.js App   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Step 1: Deploy ML Service
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1/2: Deploying ML Service${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

"$SCRIPT_DIR/deploy-ml-service.sh" "$PROJECT_ID" "$REGION"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ML Service deployment failed. Aborting.${NC}"
    exit 1
fi

# Get ML service URL
ML_SERVICE_URL=$(gcloud run services describe viim-ml \
    --platform managed \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --format 'value(status.url)' 2>/dev/null || echo "")

if [ -z "$ML_SERVICE_URL" ]; then
    echo -e "${YELLOW}⚠️  Could not retrieve ML service URL automatically${NC}"
    echo "Please provide it manually or check the deployment"
    read -p "Enter ML Service URL (or press Enter to skip): " ML_SERVICE_URL
fi

echo ""
echo -e "${GREEN}✅ ML Service deployed: $ML_SERVICE_URL${NC}"
echo ""

# Step 2: Deploy Next.js App
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2/2: Deploying Next.js App${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

"$SCRIPT_DIR/deploy-nextjs-service.sh" "$PROJECT_ID" "$REGION" "$ML_SERVICE_URL"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Next.js App deployment failed${NC}"
    exit 1
fi

# Get Next.js service URL
NEXTJS_SERVICE_URL=$(gcloud run services describe nextjs-app \
    --platform managed \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --format 'value(status.url)' 2>/dev/null || echo "")

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Deployment Complete! ✅                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📍 ML Service URL:${NC}     $ML_SERVICE_URL"
echo -e "${GREEN}📍 Next.js App URL:${NC}    $NEXTJS_SERVICE_URL"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify both services are healthy"
echo "2. Test the Next.js app at: $NEXTJS_SERVICE_URL"
echo "3. Check logs if needed:"
echo "   - ML Service: gcloud run services logs read viim-ml --region $REGION"
echo "   - Next.js:    gcloud run services logs read nextjs-app --region $REGION"
echo ""
