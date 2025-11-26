# Set Environment Variables for Cloud Run

Based on your Firebase config, run this command:

```powershell
gcloud run services update stream-disc-app `
    --region us-central1 `
    --update-env-vars `
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyANBB27ZXGMm87pIuuDr9g9PpCcZVX776E,`
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=app-streamdisc.firebaseapp.com,`
NEXT_PUBLIC_FIREBASE_PROJECT_ID=app-streamdisc,`
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=app-streamdisc.firebasestorage.app,`
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=579943470724,`
NEXT_PUBLIC_FIREBASE_APP_ID=1:579943470724:web:0f80b748cf09b8b986d4d1,`
FIREBASE_PROJECT_ID=app-streamdisc
```

## For FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY

These are from your Firebase Admin SDK service account. 

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate/download your private key JSON
3. Extract the values and add them:

```powershell
# Add these separately
gcloud run services update stream-disc-app `
    --region us-central1 `
    --update-env-vars `
FIREBASE_CLIENT_EMAIL=your-service-account@app-streamdisc.iam.gserviceaccount.com
```

For the private key (contains newlines), use a secret:

```powershell
# Create secret from your private key
gcloud secrets create firebase-private-key --data-file=path/to/privatekey.txt

# Or create from environment variable
echo "YOUR_PRIVATE_KEY_HERE" | gcloud secrets create firebase-private-key --data-file=-

# Update service to use secret
gcloud run services update stream-disc-app `
    --region us-central1 `
    --update-secrets FIREBASE_PRIVATE_KEY=firebase-private-key:latest
```

After setting environment variables, your app will be fully functional!

