# Troubleshooting - Changes Not Showing

## Quick Fixes

### 1. Hard Refresh Browser
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`
- This clears the browser cache and forces a reload

### 2. Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### 3. Restart Dev Server
Stop the current dev server (Ctrl+C) and restart:
```bash
npm run dev
```

### 4. Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for any errors (red text)
4. Share any errors you see

### 5. Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Look for failed requests (red entries)

## Verify Changes Are Applied

### Check the Read Page
1. Navigate to: `http://localhost:3000/voice-lock/read`
2. You should see:
   - White background (not dark)
   - "VoiceLock Session" title at top
   - Hamburger menu on left
   - Large circular record button at bottom
   - Dataset status on right side of bottom bar

### If Still Not Working

1. **Check file was saved**: Make sure all files were saved
2. **Check terminal for errors**: Look at the terminal running `npm run dev` for any errors
3. **Try incognito mode**: Open browser in incognito/private mode to bypass cache
4. **Check route**: Make sure you're on `/voice-lock/read` not `/voice-lock/setup`

## Common Issues

### Still seeing dark theme?
- Make sure you're on the `/voice-lock/read` page
- The read page should be white, other pages are still dark

### Components not loading?
- Check browser console for import errors
- Verify all component files exist in `components/` folder

### Record button not showing?
- Check if you're logged in
- Make sure microphone permissions are granted
- Check browser console for JavaScript errors

