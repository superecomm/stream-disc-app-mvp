# Static Export Limitation

## API Routes Not Supported

When using `output: 'export'` in `next.config.ts`, Next.js API routes (`app/api/*`) are **not supported** in the static build.

### Current Status

The build will fail if API routes are present. For Firebase Hosting static deployment, you have two options:

### Option 1: Use Firebase Functions (Recommended)

Convert your API routes to Firebase Functions:

1. Move API logic to `functions/` directory
2. Deploy functions: `firebase deploy --only functions`
3. Update frontend to call function URLs instead of `/api/*`

### Option 2: Remove API Routes Temporarily

For frontend-only deployment:

1. Temporarily move `app/api` directory
2. Build: `npm run build`
3. Deploy: `firebase deploy --only hosting`
4. Restore `app/api` directory

### Option 3: Use Different Hosting

Consider using:
- **Vercel** - Supports Next.js API routes natively
- **Netlify** - Supports serverless functions
- **Cloud Run** - Full Next.js support

### For This Project

Since you mentioned you don't need auth right now, the frontend pages will work, but any API calls will fail. You'll need to:

1. Either convert API routes to Firebase Functions
2. Or use a hosting solution that supports API routes
3. Or make the frontend work without backend API calls (client-side only)

