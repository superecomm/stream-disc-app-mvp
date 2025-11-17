# Quick Setup Guide

## Server Status
✅ The development server is running on port 3000.

## Access the App
Open your browser and go to:
- **http://localhost:3000** or
- **http://127.0.0.1:3000**

## If localhost cannot be reached:

### 1. Check if the server is running
The server should be running. If not, start it with:
```bash
npm run dev
```

### 2. Check your browser
- Try a different browser
- Clear browser cache
- Try incognito/private mode
- Check if any firewall is blocking port 3000

### 3. Check the terminal
Look for any error messages in the terminal where `npm run dev` is running.

### 4. Try a different port
If port 3000 is in use, you can specify a different port:
```bash
npm run dev -- -p 3001
```
Then access: http://localhost:3001

## Firebase Configuration (Required for full functionality)

The app will load without Firebase, but authentication and data features won't work until you configure it:

1. Create `.env.local` file in the project root:
```bash
# Copy the example file
copy env.local.example .env.local
```

2. Get your Firebase credentials:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing one
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Get your config from Project Settings > General
   - Get Admin SDK key from Project Settings > Service Accounts

3. Fill in `.env.local` with your Firebase credentials

4. Restart the dev server after adding `.env.local`

## Troubleshooting

If you see errors in the browser console:
- Check that all environment variables are set in `.env.local`
- Make sure the file is named exactly `.env.local` (not `.env.local.txt`)
- Restart the dev server after changing environment variables

