# Firebase Functions Setup Guide

## Overview

Since we're using static export for Firebase Hosting, Next.js API routes won't work. We need to migrate them to Firebase Functions.

## Current Status

✅ Firebase Functions structure created
⏳ API routes need to be migrated to Functions

## Setup Steps

### 1. Install Functions Dependencies

```bash
cd functions
npm install
```

### 2. Build Functions

```bash
npm run build
```

### 3. Deploy Functions

```bash
# From project root
firebase deploy --only functions
```

## Migration Strategy

### Option A: Quick Deploy (Frontend Only)

For now, you can deploy just the frontend:

1. Temporarily rename `app/api` to `app/_api_backup`
2. Build: `npm run build`
3. Deploy: `firebase deploy --only hosting`
4. Restore `app/api` after deployment

**Note:** API calls won't work, but the frontend will be live.

### Option B: Full Migration (Recommended)

Migrate all API routes to Firebase Functions:

1. Copy route handlers from `app/api/*` to `functions/src/`
2. Convert Next.js route handlers to Firebase Functions
3. Update frontend to call Function URLs instead of `/api/*`
4. Deploy both hosting and functions

## Function URLs

After deployment, functions will be available at:
- `https://us-central1-app-streamdisc.cloudfunctions.net/api`

You can set up custom domains in Firebase Console.

## Next Steps

1. **For MVP:** Use Option A to get the frontend deployed quickly
2. **For Production:** Migrate critical API routes to Functions (start with `/api/viim/fingerprint` and `/api/viim/enroll`)

## Example Migration

**Before (Next.js API Route):**
```typescript
// app/api/viim/fingerprint/route.ts
export async function POST(request: NextRequest) {
  // handler code
}
```

**After (Firebase Function):**
```typescript
// functions/src/viim/fingerprint.ts
export const fingerprint = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  // handler code
});
```

