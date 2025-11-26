# Project Rename: stream-disc-voice-lock → stream-disc-app-mvp

## Manual Steps Required

Since the workspace root directory cannot be renamed programmatically, please follow these steps:

### 1. Close All Applications
- Close your IDE/editor (Cursor)
- Close any terminals
- Close any running dev servers

### 2. Rename the Directory
**Windows:**
```powershell
# Navigate to parent directory
cd ..
# Rename the directory
Rename-Item -Path "stream-disc-voice-lock" -NewName "stream-disc-app-mvp"
# Navigate back into the project
cd stream-disc-app-mvp
```

**Or use File Explorer:**
1. Navigate to the parent directory
2. Right-click on `stream-disc-voice-lock` folder
3. Select "Rename"
4. Change to `stream-disc-app-mvp`

### 3. Update Git Remote (if applicable)
If you have a Git remote, you may want to update it:
```bash
git remote set-url origin <new-repo-url>
```

### 4. Verify
After renaming, verify everything works:
```bash
npm install
npm run dev
```

## What Has Been Updated

✅ `package.json` - Project name updated
✅ `README.md` - References updated
✅ Documentation files - References updated
✅ Firebase configuration - Already using `app-streamdisc` project

## What Still Needs Your Attention

- Rename the actual directory (see steps above)
- Update any IDE workspace settings
- Update any deployment scripts that reference the old path
- Update any documentation you maintain externally

