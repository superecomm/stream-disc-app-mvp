# Cloud Run Deployment Plan

## Current Issues & Why It's Taking So Long

### 1. **Configuration Conflict (CRITICAL)**
- **Problem**: `next.config.ts` has `output: 'export'` (for static export/Firebase Hosting)
- **But**: Dockerfile expects Next.js `standalone` output (for Cloud Run)
- **Impact**: Next.js build fails or produces wrong output, causing deployment to fail or hang
- **Solution**: Change `next.config.ts` to use `standalone` output for Cloud Run

### 2. **API Routes Incompatibility**
- **Problem**: Project has many API routes in `app/api/` (viim, voice-lock)
- **Current Config**: `output: 'export'` doesn't support API routes
- **Impact**: Build would fail if using static export
- **Solution**: Use `standalone` output which fully supports API routes

### 3. **Sequential Deployment Process**
- **Current Flow**: 
  1. Build ML service → Deploy ML service → Wait
  2. Build Next.js → Deploy Next.js → Wait
- **Why Slow**: Each step waits for previous, no parallelization
- **Impact**: Total time = sum of all steps (15-30+ minutes)

### 4. **Docker Build Overhead**
- **ML Service**: Installing Python deps, system packages (ffmpeg, libsndfile1)
- **Next.js**: Installing Node deps, building Next.js app, copying files
- **Impact**: Each build takes 5-10 minutes, even with caching

### 5. **Cloud Run Deployment Time**
- **Steps**: Build image → Push to Container Registry → Deploy to Cloud Run
- **Impact**: 3-5 minutes per service even after image is built

## Deployment Plan

### Phase 1: Fix Configuration Issues

#### 1.1 Update Next.js Config for Cloud Run
- [ ] Change `next.config.ts` to use `standalone` output
- [ ] Remove `output: 'export'` (incompatible with Cloud Run)
- [ ] Enable `standalone: true` in Next.js config
- [ ] Verify API routes will work

#### 1.2 Update Dockerfile
- [ ] Verify Dockerfile correctly references `.next/standalone`
- [ ] Ensure build args are properly passed
- [ ] Test local Docker build

### Phase 2: ML Service Deployment

#### 2.1 Build ML Service Container
- [ ] Navigate to `services/viim-ml/`
- [ ] Build Docker image with tag: `gcr.io/[PROJECT_ID]/viim-ml:latest`
- [ ] Push to Google Container Registry
- **Estimated Time**: 5-8 minutes

#### 2.2 Deploy ML Service to Cloud Run
- [ ] Deploy with appropriate settings:
  - Memory: 2GB (for ML models)
  - CPU: 2 vCPU
  - Min instances: 0 (for cost)
  - Max instances: 10
  - Port: 8000
- [ ] Set environment variables (if needed)
- [ ] Verify deployment health
- **Estimated Time**: 3-5 minutes

### Phase 3: Next.js Service Deployment

#### 3.1 Update Next.js Configuration
- [ ] Fix `next.config.ts` for standalone output
- [ ] Remove static export config
- [ ] Test build locally: `npm run build`

#### 3.2 Build Next.js Container
- [ ] Build with all Firebase build args:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
  - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- [ ] Tag as: `gcr.io/[PROJECT_ID]/nextjs-app:latest`
- [ ] Push to Container Registry
- **Estimated Time**: 8-12 minutes (includes npm install + Next.js build)

#### 3.3 Deploy Next.js to Cloud Run
- [ ] Deploy with settings:
  - Memory: 512MB (sufficient for Next.js)
  - CPU: 1 vCPU
  - Min instances: 0
  - Max instances: 10
  - Port: 8080
- [ ] Set environment variables:
  - `ML_SERVICE_URL` (pointing to ML service URL)
  - Any other required env vars
- [ ] Verify deployment
- **Estimated Time**: 3-5 minutes

### Phase 4: Verification & Testing

#### 4.1 Verify ML Service
- [ ] Check Cloud Run logs for ML service
- [ ] Test health endpoint (if available)
- [ ] Verify service is accessible

#### 4.2 Verify Next.js Service
- [ ] Check Cloud Run logs for Next.js service
- [ ] Test frontend pages load
- [ ] Test API routes work
- [ ] Verify ML service integration

#### 4.3 Integration Testing
- [ ] Test end-to-end flow
- [ ] Verify CORS settings (if needed)
- [ ] Check error handling

## Optimization Strategies

### 1. **Parallel Deployment** (Future)
- Deploy ML and Next.js services in parallel
- Use separate terminal sessions or CI/CD pipeline
- **Time Savings**: ~50% reduction (15 min → 8 min)

### 2. **Docker Layer Caching**
- Use Cloud Build with proper caching
- Cache npm/pip dependencies separately
- **Time Savings**: 30-50% on rebuilds

### 3. **Build Optimization**
- Use `.dockerignore` to exclude unnecessary files
- Multi-stage builds (already in place)
- **Time Savings**: 10-20% per build

### 4. **Cloud Build Integration**
- Use Cloud Build for automated deployments
- Enable build caching
- **Time Savings**: Better caching, automated retries

## Expected Timeline

### First Deployment (Current State)
- **ML Service**: 8-13 minutes
- **Next.js Service**: 11-17 minutes (if config fixed)
- **Total**: 19-30 minutes

### After Optimizations
- **ML Service**: 5-8 minutes
- **Next.js Service**: 6-10 minutes
- **Total**: 11-18 minutes (or 6-10 if parallel)

## Critical Actions Required

1. **IMMEDIATE**: Fix `next.config.ts` - remove `output: 'export'`, add `standalone: true`
2. **IMMEDIATE**: Test Next.js build locally before deploying
3. **BEFORE DEPLOY**: Ensure all Firebase env vars are available
4. **AFTER DEPLOY**: Verify both services are healthy and communicating

## Commands Reference

### ML Service
```bash
cd services/viim-ml
gcloud builds submit --tag gcr.io/[PROJECT_ID]/viim-ml:latest
gcloud run deploy viim-ml \
  --image gcr.io/[PROJECT_ID]/viim-ml:latest \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --port 8000 \
  --allow-unauthenticated
```

### Next.js Service
```bash
# Build with args
gcloud builds submit \
  --tag gcr.io/[PROJECT_ID]/nextjs-app:latest \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID \
  --build-arg NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

# Deploy
gcloud run deploy nextjs-app \
  --image gcr.io/[PROJECT_ID]/nextjs-app:latest \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --port 8080 \
  --set-env-vars ML_SERVICE_URL=https://viim-ml-[HASH].run.app \
  --allow-unauthenticated
```

## Troubleshooting

### Build Fails
- Check `next.config.ts` is correct
- Verify all build args are provided
- Check Dockerfile syntax

### Deployment Fails
- Check Cloud Run quotas
- Verify image exists in Container Registry
- Check service account permissions

### Service Unhealthy
- Check Cloud Run logs
- Verify environment variables
- Test endpoints manually
