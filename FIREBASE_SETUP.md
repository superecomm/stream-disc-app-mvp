# Firebase Setup Instructions

## Step 1: Create .env.local File

Create a file named `.env.local` in the root directory of your project with the following content:

```bash
# Firebase Client SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAoc-HXpy7gZEahXOnLMKWcwO2xzOm5Lqs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stream-disc-voice-lock.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stream-disc-voice-lock
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stream-disc-voice-lock.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=307376578590
NEXT_PUBLIC_FIREBASE_APP_ID=1:307376578590:web:08bbfe631f1114370f0e0f
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-6KXT8E1GT9

# Firebase Admin SDK Configuration
# Get these from Firebase Console > Project Settings > Service Accounts
FIREBASE_PROJECT_ID=stream-disc-voice-lock
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@stream-disc-voice-lock.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

## Step 2: Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `stream-disc-voice-lock`
3. Navigate to **Authentication** > **Sign-in method**
4. Enable **Email/Password** provider
5. Click **Save**

## Step 3: Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development) or **Start in production mode**
4. Select a location for your database
5. Click **Enable**

## Step 4: Get Admin SDK Credentials (Optional, for API routes)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click on **Service Accounts** tab
3. Click **Generate New Private Key**
4. Save the JSON file securely
5. Extract the following values and add to `.env.local`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)

## Step 5: Restart Development Server

After creating `.env.local`, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Verification

Once the server restarts, you should be able to:
- ✅ See the login/signup modal without errors
- ✅ Create new user accounts
- ✅ Sign in with existing accounts
- ✅ Access protected routes (Dashboard, Setup, Verify)

## Troubleshooting

### "Firebase configuration is missing" warning
- Make sure `.env.local` exists in the project root
- Check that all `NEXT_PUBLIC_*` variables are set
- Restart the dev server after creating/updating `.env.local`

### "Firebase Auth is not initialized" error
- Verify all environment variables are correct
- Check browser console for specific error messages
- Ensure Firebase Authentication is enabled in Firebase Console

### Authentication not working
- Check that Email/Password provider is enabled in Firebase Console
- Verify your Firebase project ID matches in `.env.local`
- Check browser console for authentication errors

## Security Notes

- ⚠️ Never commit `.env.local` to git (it's already in `.gitignore`)
- ⚠️ Keep your Firebase credentials secure
- ⚠️ For production, use environment variables in your hosting platform
- ⚠️ Admin SDK credentials should be kept extremely secure

