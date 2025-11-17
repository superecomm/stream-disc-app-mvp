# Quick Start Guide

## Access the New Reading Interface

### Step 1: Make sure dev server is running
```bash
npm run dev
```

### Step 2: Navigate to the Reading Page
Go to: **http://192.168.56.1:3000/voice-lock/read**

**Important:** The new white ChatGPT-style interface is ONLY on the `/voice-lock/read` page.

### Step 3: What You Should See

✅ **White background** (not dark)  
✅ **"VoiceLock Session"** title at top  
✅ **Hamburger menu** (☰) on the left  
✅ **Large circular record button** at bottom center  
✅ **Dataset status** on right side ("Dataset 0%")  
✅ **"+" button** on left side of bottom bar  

### Other Pages Still Use Dark Theme
- `/dashboard` - Dark theme (unchanged)
- `/voice-lock/setup` - Dark theme (unchanged)  
- `/voice-lock/verify` - Dark theme (unchanged)
- `/voice-lock/read` - **NEW White theme** ✨

### If You Don't See the White Interface

1. **Hard refresh**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. **Check the URL**: Make sure it ends with `/voice-lock/read`
3. **Clear browser cache**: Open DevTools (F12) → Right-click refresh → "Empty Cache and Hard Reload"
4. **Check console**: Look for any errors in browser DevTools console

### Troubleshooting

**Server not starting?**
- Make sure port 3000 is not in use
- Check for errors in terminal
- Try: `npm run dev -- -p 3001` (then use port 3001)

**Still seeing old interface?**
- Make sure you're on `/voice-lock/read` not `/voice-lock/setup`
- Try incognito/private browser window
- Restart the dev server completely

