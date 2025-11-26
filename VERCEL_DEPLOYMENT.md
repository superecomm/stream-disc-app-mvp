# Vercel Deployment Instructions

## Quick Deploy Steps

1. **Login to Vercel**:
   ```bash
   vercel login
   ```
   Follow the prompts to authenticate via email or GitHub.

2. **Deploy to Production**:
   ```bash
   vercel --prod
   ```
   This will:
   - Build your Next.js application
   - Deploy to Vercel's CDN
   - Provide you with a production URL

3. **Add Environment Variables**:
   After first deployment, add your environment variables:
   
   a. Go to [Vercel Dashboard](https://vercel.com/dashboard)
   b. Select your project (`stream-disc-app-mvp`)
   c. Go to Settings → Environment Variables
   d. Add the following variables:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
   NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
   
   FIREBASE_PROJECT_ID=<your-project-id>
   FIREBASE_CLIENT_EMAIL=<service-account-email>
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   
   NEXT_PUBLIC_ML_SERVICE_URL=<your-ml-service-url>
   ```

4. **Redeploy with Environment Variables**:
   ```bash
   vercel --prod
   ```

## Connect GitHub for Auto-Deploy

1. Go to your project on Vercel Dashboard
2. Settings → Git
3. Connect your GitHub repository
4. Now every push to `master` will auto-deploy!

## Custom Domain (Optional)

1. Go to Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Monitoring

- **Analytics**: Vercel Dashboard → Analytics
- **Logs**: Vercel Dashboard → Deployments → View Function Logs
- **Performance**: Check Web Vitals in Analytics tab

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Verify Next.js configuration

### Environment Variables Not Working
- Make sure to redeploy after adding variables
- Check variable names match exactly (case-sensitive)
- For FIREBASE_PRIVATE_KEY, ensure proper escaping of newlines

### API Routes 404
- Verify routes are in `app/api/` directory
- Check Next.js configuration doesn't have `output: 'export'`
- Ensure proper file naming (route.ts)

## Next Steps

After Vercel deployment is stable:
1. Deploy ML service to Cloud Run
2. Update `NEXT_PUBLIC_ML_SERVICE_URL` to Cloud Run URL
3. Plan migration to Cloud Run for full application

---

**Repository**: https://github.com/superecomm/stream-disc-app-mvp
**Status**: Ready for Vercel deployment

