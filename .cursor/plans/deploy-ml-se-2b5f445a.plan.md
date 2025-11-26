<!-- 2b5f445a-efba-470d-8667-d3abb31b49c2 044dc865-bb64-4406-9a0e-9ce31aed3d65 -->
# Deploy ML Service to Cloud Run with Database Storage

## What Gets Stored

The ML service automatically stores in DuckDB database (`voiceprints.db`):

**For EVERY voice recording processed:**

- Recording ID, user ID, timestamp
- Audio metadata (duration, file size, sample rate, format)
- Full 192-dimensional embedding vector
- Mode (test/enroll/identify)
- Voiceprint ID (for enrolled voices)
- Similarity scores (for identification)
- Processing metadata (model name, source)

**Queryable for performance review:**

- Get all recordings by user
- Get recordings by voiceprint
- Search by embedding similarity
- Get recent recordings
- Filter by mode (test/enroll/identify)

## Deployment Steps

### 1. Create Dockerfile for ML Service

Create `services/viim-ml/Dockerfile`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Cloud Run will set PORT
ENV PORT 8080
EXPOSE 8080

# Run with uvicorn
CMD exec uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
```

### 2. Deploy ML Service to Cloud Run

```powershell
cd services/viim-ml

gcloud run deploy viim-ml-service \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 3
```

**Specs explanation:**

- **2GB RAM**: ECAPA-TDNN model requires ~1.5GB
- **2 CPUs**: Faster embedding extraction
- **300s timeout**: Some recordings may take time
- **Max 3 instances**: Cost control (~$15-20/month at moderate usage)

### 3. Get ML Service URL

After deployment completes:

```powershell
$ML_URL = gcloud run services describe viim-ml-service --region us-central1 --format "value(status.url)"
echo $ML_URL
```

### 4. Update Next.js App with ML Service URL

```powershell
gcloud run services update stream-disc-app \
    --region us-central1 \
    --update-env-vars NEXT_PUBLIC_ML_SERVICE_URL=$ML_URL
```

### 5. Test the Integration

1. Open: https://stream-disc-app-ftgizdc7wa-uc.a.run.app
2. Beta test page should load
3. Click neural box → Record voice
4. Process log should show: "Connected to ML model: speechbrain/spkrec-ecapa-voxceleb"
5. Output should display real 192-dimensional embeddings

## Database Access for Performance Review

The DuckDB database (`voiceprints.db`) is stored in the ML service container.

**Important notes:**

- Data persists during container lifetime
- For production: mount persistent volume or use Cloud Storage
- For now: Database resets when container restarts (acceptable for testing)

**To review performance later (after production volume setup):**

1. SSH into Cloud Run container
2. Query database:
   ```python
   import duckdb
   conn = duckdb.connect('voiceprints.db')
   
   # Get all test recordings
   conn.execute("SELECT * FROM recordings WHERE mode = 'test'").df()
   
   # Get recent enrollments
   conn.execute("SELECT * FROM recordings WHERE mode = 'enroll' ORDER BY created_at DESC LIMIT 10").df()
   
   # Get recordings by user
   conn.execute("SELECT * FROM recordings WHERE user_id = ?", [user_id]).df()
   ```


## Cost Estimate

**Cloud Run ML Service:**

- Idle: ~$5/month (min instances = 0, scales to zero)
- Light usage (100 req/day): ~$10/month
- Moderate usage (500 req/day): ~$15-20/month

**Main App (already deployed):**

- ~$2-5/month

**Total: $7-25/month** depending on usage

## What Happens After Deployment

1. Voice recording flow works end-to-end
2. Real AI embeddings generated (not fallbacks)
3. All recordings stored in database
4. Beta test page shows "ML Model Connected ✓"
5. Enrollment creates real voiceprints
6. Identification matches against enrolled voices
7. Performance data available for review

## Files Modified

- `services/viim-ml/Dockerfile` (new)
- Cloud Run service: `stream-disc-app` (env var update)
- Cloud Run service: `viim-ml-service` (new deployment)