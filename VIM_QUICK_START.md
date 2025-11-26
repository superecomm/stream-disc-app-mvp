# VIM Quick Start Checklist

Use this checklist when copying VIM to www.thestreamdisc.com

## Pre-Migration

- [ ] Review `VIM_MIGRATION_GUIDE.md` for full details
- [ ] Backup current www.thestreamdisc.com project
- [ ] Ensure Firebase configuration is ready
- [ ] Verify Next.js version compatibility (16.0.3+)

## File Copy (Priority Order)

### 1. Core Components (Copy First)
- [ ] `components/ChatMessage.tsx`
- [ ] `components/VoiceTranscription.tsx`
- [ ] `components/ReadingLane.tsx`
- [ ] `components/RecordButton.tsx` (updated version)
- [ ] `components/AudioSettings.tsx`
- [ ] `components/UserAvatar.tsx` (updated version)

### 2. Pages
- [ ] `app/voice-lock/read/page.tsx`
- [ ] `app/voice-lock/sessions/page.tsx`

### 3. API Routes
- [ ] `app/api/voice-lock/session/route.ts` (updated)
- [ ] `app/api/voice-lock/sessions/route.ts` (new)

### 4. Types & Utilities
- [ ] `types/voiceLock.ts` (updated with ChatMessage)
- [ ] `lib/firestore.ts` (updated to save chat data)

## Configuration

- [ ] Update Firebase config if needed
- [ ] Verify environment variables are set
- [ ] Test Firebase connection
- [ ] Check Firestore security rules

## Branding Updates

- [ ] Search & replace "VoiceLock" → "VIM" or "Voice Identity Model"
- [ ] Update page titles
- [ ] Update navigation labels
- [ ] Update meta descriptions
- [ ] Update favicon/logo if needed

## Homepage Integration

- [ ] Add VIM hero section (see `VIM_HOMEPAGE_CONTENT.md`)
- [ ] Add features section
- [ ] Add "How It Works" section
- [ ] Add call-to-action buttons
- [ ] Update navigation menu

## Testing

- [ ] Test voice recording
- [ ] Test real-time transcription
- [ ] Test message display
- [ ] Test audio playback
- [ ] Test session saving
- [ ] Test session history page
- [ ] Test on mobile devices
- [ ] Test on desktop
- [ ] Test in Chrome
- [ ] Test in Safari
- [ ] Verify no duplicate messages
- [ ] Verify continuous recording

## Post-Migration

- [ ] Update documentation
- [ ] Add analytics tracking
- [ ] Set up error monitoring
- [ ] Create user guide/help docs
- [ ] Announce to users

## Optional Enhancements

- [ ] Rename routes from `/voice-lock/*` to `/vim/*`
- [ ] Add onboarding tutorial
- [ ] Add keyboard shortcuts
- [ ] Add export functionality
- [ ] Add sharing capabilities
- [ ] Add voice quality indicators

## Rollback Plan

If issues occur:
1. Revert file changes
2. Restore from backup
3. Check Firebase logs
4. Review browser console errors
5. Verify API endpoints are accessible

---

**Estimated Time**: 2-4 hours for full migration
**Difficulty**: Medium
**Dependencies**: Next.js 16+, Firebase, Web Speech API support

