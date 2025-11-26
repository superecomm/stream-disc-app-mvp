# Cloud Run Deployment Script for Stream Disc App MVP

# Exit on error
$ErrorActionPreference = "Stop"

Write-Host "🚀 Stream Disc App - Cloud Run Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
Write-Host "Checking for gcloud CLI..." -ForegroundColor Yellow
try {
    $gcloudVersion = gcloud version 2>&1
    Write-Host "✓ gcloud CLI found" -ForegroundColor Green
} catch {
    Write-Host "✗ gcloud CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install gcloud CLI from:" -ForegroundColor Yellow
    Write-Host "https://cloud.google.com/sdk/docs/install" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installation, run:" -ForegroundColor Yellow
    Write-Host "  gcloud init" -ForegroundColor Cyan
    Write-Host "  gcloud auth login" -ForegroundColor Cyan
    exit 1
}

Write-Host ""

# Get current project
$currentProject = gcloud config get-value project 2>$null
if ($currentProject) {
    Write-Host "Current GCP Project: $currentProject" -ForegroundColor Green
    $useProject = Read-Host "Use this project? (Y/n)"
    if ($useProject -eq "n" -or $useProject -eq "N") {
        $projectId = Read-Host "Enter your GCP Project ID"
        gcloud config set project $projectId
    } else {
        $projectId = $currentProject
    }
} else {
    Write-Host "No GCP project configured" -ForegroundColor Yellow
    $projectId = Read-Host "Enter your GCP Project ID"
    gcloud config set project $projectId
}

Write-Host ""
Write-Host "Using project: $projectId" -ForegroundColor Green
Write-Host ""

# Enable required APIs
Write-Host "Enabling required Google Cloud APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com --project=$projectId
gcloud services enable cloudbuild.googleapis.com --project=$projectId
gcloud services enable artifactregistry.googleapis.com --project=$projectId
Write-Host "✓ APIs enabled" -ForegroundColor Green
Write-Host ""

# Set region
$region = "us-central1"
Write-Host "Using region: $region" -ForegroundColor Green
Write-Host ""

# Build and deploy
Write-Host "🔨 Building and deploying to Cloud Run..." -ForegroundColor Cyan
Write-Host "This may take 5-10 minutes..." -ForegroundColor Yellow
Write-Host ""

gcloud run deploy stream-disc-app `
    --source . `
    --platform managed `
    --region $region `
    --allow-unauthenticated `
    --min-instances 0 `
    --max-instances 10 `
    --memory 512Mi `
    --cpu 1 `
    --project=$projectId

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    
    # Get service URL
    $serviceUrl = gcloud run services describe stream-disc-app --region=$region --format="value(status.url)" --project=$projectId
    Write-Host "🌐 Your app is live at:" -ForegroundColor Cyan
    Write-Host $serviceUrl -ForegroundColor Green
    Write-Host ""
    
    Write-Host "⚠️  IMPORTANT: Set environment variables" -ForegroundColor Yellow
    Write-Host "Run the following command with your Firebase credentials:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "gcloud run services update stream-disc-app --region=$region --update-env-vars NEXT_PUBLIC_FIREBASE_API_KEY=your_key,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain,NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender,NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id,FIREBASE_PROJECT_ID=your_project,FIREBASE_CLIENT_EMAIL=your_email" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✗ Deployment failed" -ForegroundColor Red
    Write-Host "Check the error messages above" -ForegroundColor Yellow
}

