# Quick Start - Deploy to Cloud Run

## You're Ready to Deploy! 🚀

All files are configured. Here's what to do:

### Step 1: Check Your GCP Project

```powershell
# Check current project
gcloud config get-value project

# If not set or wrong project, set it:
gcloud config set project YOUR_PROJECT_ID

# Login if needed
gcloud auth login
```

### Step 2: Enable Required APIs

```powershell
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### Step 3: Deploy Main App

```powershell
# Deploy to Cloud Run (this will build and deploy)
gcloud run deploy stream-disc-app `
    --source . `
    --platform managed `
    --region us-central1 `
    --allow-unauthenticated `
    --min-instances 0 `
    --max-instances 10 `
    --memory 512Mi `
    --cpu 1
```

This will:
- ✅ Build your Docker image
- ✅ Push to Google Container Registry
- ✅ Deploy to Cloud Run
- ✅ Give you a live URL

**Time**: 5-10 minutes

### Step 4: Set Environment Variables

After deployment, set your Firebase credentials:

```powershell
gcloud run services update stream-disc-app `
    --region us-central1 `
    --update-env-vars `
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key,`
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com,`
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id,`
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com,`
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id,`
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id,`
FIREBASE_PROJECT_ID=your_project_id,`
FIREBASE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
```

For the private key (sensitive), use Google Secret Manager:

```powershell
# Create secret
echo "your-private-key-content" | gcloud secrets create firebase-private-key --data-file=-

# Update service to use secret
gcloud run services update stream-disc-app `
    --region us-central1 `
    --update-secrets FIREBASE_PRIVATE_KEY=firebase-private-key:latest
```

### Step 5: Deploy ML Service

```powershell
cd services/viim-ml

gcloud run deploy viim-ml-service `
    --source . `
    --platform managed `
    --region us-central1 `
    --allow-unauthenticated `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300
```

### Step 6: Connect ML Service to Main App

```powershell
# Get ML service URL
$ML_URL = gcloud run services describe viim-ml-service --region us-central1 --format "value(status.url)"

# Update main app with ML service URL
gcloud run services update stream-disc-app `
    --region us-central1 `
    --update-env-vars NEXT_PUBLIC_ML_SERVICE_URL=$ML_URL
```

## Or Use the Automated Script

```powershell
# Run the deployment script
.\deploy-cloudrun.ps1
```

## View Your Deployed App

```powershell
# Get the URL
gcloud run services describe stream-disc-app --region us-central1 --format "value(status.url)"

# View logs
gcloud run services logs tail stream-disc-app --region us-central1
```

## What You Get

- 🌐 **Live URL**: Your app accessible worldwide
- 📊 **Auto-scaling**: Scales to zero when not in use
- 💰 **Cost-effective**: Pay only for actual usage
- 🔐 **Secure**: HTTPS by default
- 📈 **Monitoring**: Google Cloud Console logs & metrics
- 🚀 **Fast**: Global CDN

## Cost Estimate

With Cloud Run free tier:
- **2 million requests/month** - FREE
- **360,000 GiB-seconds/month** - FREE
- **180,000 vCPU-seconds/month** - FREE

Your app will likely cost **$0-5/month** for development/testing.

## Troubleshooting

**Build fails?**
```powershell
# Check Docker locally
docker build -t test .
```

**Can't access?**
```powershell
# Make sure it's public
gcloud run services add-iam-policy-binding stream-disc-app `
    --region us-central1 `
    --member allUsers `
    --role roles/run.invoker
```

**View logs:**
```powershell
gcloud run services logs read stream-disc-app --region us-central1 --limit 50
```

---

**Ready?** Run the deployment command above or use the script!

