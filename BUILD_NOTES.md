# Build Notes - Stream Disc App MVP

## 🏗️ Build Configuration

### Next.js Configuration

**File**: `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled static export to support API routes
  // For Firebase deployment, consider using Vercel or deploying Next.js as a server
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

**Key Points**:
- API routes require server-side rendering
- Static export (`output: 'export'`) is disabled to support API routes
- Images are unoptimized for faster builds (can be optimized in production)

### Package Dependencies

**Main Dependencies**:
- `next@16.0.3` - Next.js framework
- `react@19.2.0` - React library
- `firebase@12.6.0` - Firebase client SDK
- `firebase-admin@13.6.0` - Firebase Admin SDK
- `lucide-react@0.554.0` - Icon library

**Dev Dependencies**:
- `typescript@5` - TypeScript compiler
- `tailwindcss@4` - CSS framework
- `eslint@9` - Code linting
- `@types/node`, `@types/react` - Type definitions

### Build Process

1. **Development Build**:
   ```bash
   npm run dev
   ```
   - Starts Next.js development server on port 3000
   - Hot reload enabled
   - TypeScript type checking
   - Tailwind CSS compilation

2. **Production Build**:
   ```bash
   npm run build
   ```
   - Compiles TypeScript
   - Optimizes React components
   - Generates static assets
   - Creates production bundles

3. **Production Server**:
   ```bash
   npm run start
   ```
   - Runs optimized production server
   - Serves built assets
   - API routes active

## 🚀 Deployment Options

### Option 1: Vercel (Current - Recommended)

**Pros**:
- Native Next.js support
- Automatic builds on git push
- Edge functions for API routes
- Zero configuration
- Free tier available

**Deployment Steps**:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

4. Configure Environment Variables:
   - Go to Vercel Dashboard
   - Select your project
   - Settings → Environment Variables
   - Add all variables from `.env.local`:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY`
     - `NEXT_PUBLIC_ML_SERVICE_URL`

5. Redeploy after environment variables are set

**Auto-Deploy**:
- Connect GitHub repository in Vercel
- Automatic deployments on push to main/master
- Preview deployments for pull requests

### Option 2: Cloud Run (Planned Migration)

**Pros**:
- Full control over deployment
- Better integration with Google Cloud services
- Can run ML service in same environment
- More cost-effective at scale
- Better for Firebase integration

**Requirements**:
- Docker container
- Cloud Run service
- Cloud Build for CI/CD
- Service account with proper permissions

**Migration Steps** (To be completed):

1. Create Dockerfile:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. Build container:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/stream-disc-app
   ```

3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy stream-disc-app \
     --image gcr.io/PROJECT_ID/stream-disc-app \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

4. Set environment variables:
   ```bash
   gcloud run services update stream-disc-app \
     --update-env-vars KEY=VALUE
   ```

### Option 3: Firebase Hosting + Functions (Not Recommended)

**Why not recommended**:
- Complex setup for Next.js
- Requires framework-specific configuration
- API routes need to be rewritten as Cloud Functions
- Limited Next.js features support

## 🔧 Build Optimizations

### Current Optimizations

1. **Tree Shaking**: Unused code is removed automatically
2. **Code Splitting**: Automatic route-based code splitting
3. **Minification**: JavaScript and CSS are minified
4. **Image Optimization**: Disabled for faster builds (can be enabled)

### Future Optimizations

1. **Enable Image Optimization**:
   ```typescript
   images: {
     unoptimized: false,
     domains: ['your-domain.com'],
   }
   ```

2. **Add Bundle Analyzer**:
   ```bash
   npm install @next/bundle-analyzer
   ```

3. **Implement ISR** (Incremental Static Regeneration):
   ```typescript
   export const revalidate = 60; // Revalidate every 60 seconds
   ```

4. **Use SWC Minifier** (already default in Next.js 16)

## 📦 Firebase Functions Build

**Location**: `functions/`

### Build Steps:

1. Install dependencies:
   ```bash
   cd functions
   npm install
   ```

2. Build TypeScript:
   ```bash
   npm run build
   ```
   - Compiles `src/index.ts` to `lib/index.js`
   - Uses `tsconfig.json` for configuration

3. Deploy:
   ```bash
   npm run deploy
   ```
   - Deploys to Firebase Functions
   - Uses Node.js 20 runtime

### Issues & Solutions:

**Issue**: Service account authentication errors
**Solution**: 
- Ensure Google App Engine instance is created
- Enable required APIs in Google Cloud Console
- Wait for API enablement to propagate (can take 5-10 minutes)

## 🐍 ML Service Build

**Location**: `services/viim-ml/`

### Build Steps:

1. Install Python dependencies:
   ```bash
   cd services/viim-ml
   pip install -r requirements.txt
   ```

2. Run development server:
   ```bash
   python main.py
   ```
   - Starts FastAPI server on port 8000
   - Loads ECAPA-TDNN model
   - Provides embedding endpoints

3. Docker build (for production):
   ```bash
   docker build -t viim-ml .
   docker run -p 8000:8000 viim-ml
   ```

### Dependencies:

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `torch` - PyTorch for ML models
- `torchaudio` - Audio processing
- `speechbrain` - Pre-trained models
- `duckdb` - Embedded database

## 🔍 Build Troubleshooting

### Common Issues

1. **TypeScript Errors**:
   ```bash
   # Clear TypeScript cache
   rm -rf .next
   npm run build
   ```

2. **Module Not Found**:
   ```bash
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Firebase Admin Errors**:
   - Check environment variables are properly set
   - Ensure private key has proper line breaks (`\n`)
   - Verify service account permissions

4. **Build Timeout on Vercel**:
   - Increase build timeout in project settings
   - Optimize dependencies
   - Use build cache

5. **Memory Issues**:
   ```bash
   # Increase Node memory
   NODE_OPTIONS=--max_old_space_size=4096 npm run build
   ```

## 📊 Build Metrics

### Current Build Stats:
- **Build Time**: ~20-30 seconds (development)
- **Bundle Size**: ~500KB (gzipped)
- **Pages**: 15+
- **API Routes**: 20+
- **Components**: 30+

### Performance Targets:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: > 90

## 🔄 CI/CD Pipeline (Planned)

### GitHub Actions Workflow:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 📝 Build Checklist

Before deploying:
- [ ] All environment variables set
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Build completes successfully
- [ ] Manual testing passed
- [ ] Firebase security rules updated
- [ ] ML service is running (if needed)
- [ ] Documentation updated

## 🎯 Next Steps

1. Complete Vercel deployment
2. Set up custom domain
3. Configure production ML service
4. Implement monitoring and logging
5. Plan Cloud Run migration
6. Set up automated testing
7. Implement CI/CD pipeline

---

**Last Updated**: November 26, 2024
**Version**: MVP 0.1.0

