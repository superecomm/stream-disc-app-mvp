# Commit and Push to GitHub

## Quick Commands

Run these commands to backup your changes to GitHub:

```bash
# Add all changes
git add .

# Commit with message
git commit -m "Rebrand to Stream Disc, add Firebase deployment config, and nearest recordings feature"

# Push to GitHub
git push origin master
```

## What's Being Committed

### Branding Updates
- ✅ Removed "Voice Lock" references
- ✅ Updated to "Stream Disc" branding
- ✅ Updated package.json name
- ✅ Updated README.md

### New Features
- ✅ Nearest recordings search & comparison
- ✅ DuckDB integration for recording storage
- ✅ ML service with embedding extraction

### Deployment Files
- ✅ `firebase.json` - Firebase Hosting config
- ✅ `.firebaserc` - Firebase project config
- ✅ `next.config.ts` - Updated for static export
- ✅ Deployment guides

### Documentation
- ✅ `FIREBASE_DEPLOYMENT.md`
- ✅ `GITHUB_SETUP.md`
- ✅ `DEPLOYMENT_QUICK_START.md`
- ✅ `NEAREST_RECORDINGS_FEATURE.md`

## If You Get Errors

### Authentication Error
If you get authentication errors:
```bash
# Use personal access token or SSH
git remote set-url origin https://YOUR_TOKEN@github.com/USERNAME/REPO.git
```

### Large Files
If files are too large:
```bash
# Check file sizes
git ls-files | xargs ls -lh | sort -k5 -hr | head -20
```

## Verify Push

After pushing, check your GitHub repository to confirm all files are there.

