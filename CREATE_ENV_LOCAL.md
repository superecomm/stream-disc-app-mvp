# Create .env.local File - Quick Guide

## The Problem
You're seeing the error: "Firebase Auth is not initialized. Please check your .env.local file."

This means the `.env.local` file is missing or the environment variables aren't being loaded.

## Solution: Create .env.local File

### Step 1: Create the File
In the root directory of your project (`C:\stream-disc-voice-lock`), create a new file named exactly:
```
.env.local
```

**Important:** 
- The file must be named `.env.local` (with the dot at the beginning)
- It must be in the root directory (same folder as `package.json`)
- Make sure it's not named `.env.local.txt` (Windows sometimes adds .txt)

### Step 2: Add This Content
Copy and paste this entire content into the `.env.local` file:

```bash
# Firebase Client SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAoc-HXpy7gZEahXOnLMKWcwO2xzOm5Lqs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stream-disc-voice-lock.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stream-disc-voice-lock
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stream-disc-voice-lock.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=307376578590
NEXT_PUBLIC_FIREBASE_APP_ID=1:307376578590:web:08bbfe631f1114370f0e0f
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-6KXT8E1GT9

# Firebase Admin SDK Configuration (Optional for now - needed for API routes)
# Get these from Firebase Console > Project Settings > Service Accounts
FIREBASE_PROJECT_ID=stream-disc-voice-lock
FIREBASE_CLIENT_EMAIL=your-service-account-email@stream-disc-voice-lock.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

### Step 3: Save the File
Save the file and make sure it's saved as `.env.local` (not `.env.local.txt`)

### Step 4: Restart the Dev Server
**This is critical!** Next.js only loads environment variables when it starts.

1. Stop the current dev server (press `Ctrl+C` in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 5: Verify It Works
1. Open your browser to `http://localhost:3000`
2. Open the browser console (F12)
3. You should see: `✅ Firebase initialized successfully`
4. Try signing up - it should work now!

## Troubleshooting

### Still seeing the error?
1. **Check the file name**: Make sure it's `.env.local` not `.env.local.txt`
   - In Windows Explorer, go to View → Show → File name extensions
   - Make sure the file shows as `.env.local` not `.env.local.txt`

2. **Check the file location**: The file must be in the root directory
   - Same folder as `package.json`
   - Same folder as `next.config.ts`

3. **Restart the server**: Environment variables are only loaded when Next.js starts
   - Stop the server completely (Ctrl+C)
   - Start it again (`npm run dev`)

4. **Check for typos**: Make sure all variable names start with `NEXT_PUBLIC_`
   - No spaces around the `=` sign
   - No quotes around the values (except for FIREBASE_PRIVATE_KEY)

5. **Check browser console**: Look for error messages that might give more details

### Using VS Code?
1. Right-click in the file explorer
2. Select "New File"
3. Type `.env.local` as the filename
4. Paste the content
5. Save

### Using Windows Notepad?
1. Open Notepad
2. Paste the content
3. Go to File → Save As
4. In "Save as type", select "All Files (*.*)"
5. Type `.env.local` as the filename (with the dot!)
6. Save in the project root directory

## What Each Variable Does

- `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase API key (public, safe to expose)
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: For file storage (future use)
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: For push notifications (future use)
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Your Firebase app ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: For Google Analytics (optional)

The `NEXT_PUBLIC_` prefix makes these variables available in the browser. Without it, they won't work in client-side code.

## Next Steps After Creating .env.local

1. **Enable Firebase Authentication:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - Click Save

2. **Enable Firestore:**
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location
   - Click Enable

After these steps, authentication should work perfectly!

