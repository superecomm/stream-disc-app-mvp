# VIM (Voice Identity Model) - Migration Guide

## Project Overview

VIM (Voice Identity Model) is a ChatGPT-style voice recording and transcription application for Stream Disc. It allows users to record their voice, see real-time transcription, and save chat sessions with audio playback.

**Tagline**: "The ChatGPT for Stream Disc"

## Key Features

1. **Real-time Voice Transcription**: Uses Web Speech API for live speech-to-text
2. **ChatGPT-style UI**: Centered chat interface with message bubbles
3. **Audio Playback**: Each message includes audio playback functionality
4. **Auto-save Sessions**: Automatically saves chat sessions with transcripts
5. **Session History**: View and replay past voice sessions
6. **Multiple Recording Modes**: Voice, Video, Solfege, and Script modes

## Project Structure

```
stream-disc-voice-lock/
├── app/
│   ├── api/
│   │   └── voice-lock/
│   │       ├── session/route.ts          # Save sessions with transcripts
│   │       └── sessions/route.ts         # Fetch saved sessions
│   └── voice-lock/
│       ├── read/page.tsx                 # Main recording page
│       └── sessions/page.tsx              # Chat sessions history page
├── components/
│   ├── ChatMessage.tsx                    # ChatGPT-style message component
│   ├── VoiceTranscription.tsx             # Real-time transcription component
│   ├── ReadingLane.tsx                    # Main content area (switches to transcription in voice mode)
│   ├── RecordButton.tsx                   # Recording button with audio capture
│   ├── AudioSettings.tsx                  # Microphone device selection
│   └── UserAvatar.tsx                     # User menu (adds "Chat Sessions" link)
├── types/
│   └── voiceLock.ts                       # TypeScript types (includes ChatMessage type)
└── lib/
    └── firestore.ts                       # Database functions (updated to save chat data)
```

## Dependencies

### Core Dependencies
```json
{
  "next": "16.0.3",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "firebase": "^12.6.0",
  "firebase-admin": "^13.6.0",
  "lucide-react": "^0.554.0"
}
```

### Key Technologies
- **Next.js 16**: React framework
- **Firebase**: Authentication and Firestore database
- **Web Speech API**: Browser-based speech recognition
- **MediaRecorder API**: Audio recording
- **TypeScript**: Type safety

## Migration Steps

### 1. Copy Core Files

Copy these files/folders to the www.thestreamdisc.com project:

```
Essential Files:
- app/voice-lock/read/page.tsx
- app/voice-lock/sessions/page.tsx
- app/api/voice-lock/session/route.ts
- app/api/voice-lock/sessions/route.ts
- components/ChatMessage.tsx
- components/VoiceTranscription.tsx
- components/ReadingLane.tsx (updated version)
- components/RecordButton.tsx (updated version)
- components/AudioSettings.tsx
- components/UserAvatar.tsx (updated version)
- types/voiceLock.ts (updated with ChatMessage type)
- lib/firestore.ts (updated to save chat messages)
```

### 2. Update Project Name and Branding

#### Rename Routes (Optional)
- Consider renaming `/voice-lock/read` to `/vim` or `/vim/record`
- Consider renaming `/voice-lock/sessions` to `/vim/sessions`

#### Update Text References
Search and replace:
- "VoiceLock" → "VIM" or "Voice Identity Model"
- "VoiceLock Session" → "VIM Session" or "Voice Identity Model"
- Update page titles and headers

### 3. Database Schema Updates

The `VoiceLockSession` type now includes:
```typescript
export type ChatMessage = {
  id: string;
  transcript: string;
  timestamp: string; // ISO string
  audioBlobUrl?: string; // URL to audio file if stored
};

export type VoiceLockSession = {
  // ... existing fields
  transcript?: string; // Full transcript text
  chatMessages?: ChatMessage[]; // Array of chat messages
};
```

**Firestore Collections**:
- `voiceLockSessions` - Already exists, now includes `transcript` and `chatMessages` fields
- No new collections needed

### 4. API Endpoints

#### POST `/api/voice-lock/session`
**New FormData fields**:
- `transcript` (optional): Full transcript text
- `chatMessages` (optional): JSON string of chat messages array

**Response**: Same as before, but session now includes transcript/chatMessages

#### GET `/api/voice-lock/sessions`
**New endpoint** to fetch saved sessions:
- Query param: `userId`
- Returns: `{ sessions: VoiceLockSession[] }`
- Filters to only sessions with chat messages

### 5. Component Integration

#### Main Recording Page (`app/voice-lock/read/page.tsx`)
Key changes:
- Added `voiceModeChatMessagesRef` to track chat messages
- Added `handleTranscriptComplete` callback
- Updated `saveSession` to include transcript and chatMessages
- Passes `onTranscriptComplete` to ReadingLane

#### ReadingLane Component
- Detects pure voice mode (`mode === "voice" && !testType`)
- Shows `VoiceTranscription` component instead of reading prompts
- Passes `onTranscriptComplete` callback

#### VoiceTranscription Component
- Real-time speech recognition using Web Speech API
- Displays messages in ChatGPT-style format
- Records audio segments for each message
- Only finalizes messages when recording stops (not during pauses)
- Prevents duplicate messages

### 6. Homepage Updates

Create a new section or page for VIM:

**Suggested Content**:
```markdown
# VIM - Voice Identity Model

The ChatGPT for Stream Disc

Record your voice, see real-time transcription, and build your voice identity. 
VIM uses advanced speech recognition to create a seamless voice-to-text experience.

[Start Recording] button → links to /voice-lock/read (or /vim)
```

### 7. Navigation Updates

Add to main navigation:
- "VIM" or "Voice Identity Model" link
- "Chat Sessions" link (already in UserAvatar menu)

### 8. Configuration

#### Environment Variables
Ensure these are set:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

#### Firebase Rules
No changes needed - existing rules should work.

### 9. Browser Compatibility

**Web Speech API Support**:
- ✅ Chrome/Edge: Full support
- ✅ Safari: Full support
- ⚠️ Firefox: Limited support (may need fallback)

**MediaRecorder Support**:
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support (iOS 14.3+)

## Key Implementation Details

### Voice Transcription Flow

1. User selects "Voice" mode
2. User clicks record button
3. `RecordButton` requests microphone access
4. `VoiceTranscription` component:
   - Initializes Web Speech API
   - Starts MediaRecorder for audio capture
   - Displays real-time transcription
   - Accumulates transcript text
5. When recording stops:
   - Finalizes message with full transcript
   - Creates audio blob
   - Saves to session via API
   - Displays in chat interface

### Preventing Duplicate Messages

The component uses:
- `finalizedRef` to prevent multiple finalizations
- Duplicate detection before adding messages
- Unique message IDs with counter + random string

### Continuous Recording

- No automatic message splitting during recording
- All speech captured in one continuous message
- Only finalizes when user stops recording
- Prevents premature breaks during natural pauses

## Testing Checklist

- [ ] Voice mode starts recording
- [ ] Real-time transcription appears
- [ ] Messages display in ChatGPT style
- [ ] Audio playback works for each message
- [ ] Sessions save with transcripts
- [ ] Chat Sessions page loads saved sessions
- [ ] No duplicate messages appear
- [ ] Recording doesn't stop prematurely
- [ ] Mobile responsive design works
- [ ] Desktop centering works correctly

## Known Issues & Solutions

### Issue: Speech recognition stops working
**Solution**: Web Speech API may need permission refresh. Check browser console.

### Issue: Duplicate messages
**Solution**: Already fixed with duplicate detection and finalizedRef guard.

### Issue: Recording stops too frequently
**Solution**: Removed automatic silence timer - only finalizes on stop.

### Issue: Audio not playing
**Solution**: Check browser support for MediaRecorder and audio codecs.

## Next Steps for www.thestreamdisc.com

1. **Copy files** listed in step 1
2. **Update branding** from VoiceLock to VIM
3. **Add homepage section** introducing VIM
4. **Update navigation** to include VIM link
5. **Test thoroughly** with real users
6. **Consider renaming routes** to `/vim/*` for cleaner URLs
7. **Add analytics** to track usage
8. **Add help/onboarding** for first-time users

## File Mapping Reference

| Source File | Destination | Notes |
|------------|------------|-------|
| `app/voice-lock/read/page.tsx` | `app/vim/record/page.tsx` | Optional rename |
| `app/voice-lock/sessions/page.tsx` | `app/vim/sessions/page.tsx` | Optional rename |
| `components/VoiceTranscription.tsx` | `components/VoiceTranscription.tsx` | Keep name or rename to `VIMTranscription.tsx` |
| `components/ChatMessage.tsx` | `components/ChatMessage.tsx` | Keep name |
| `types/voiceLock.ts` | `types/voiceLock.ts` or `types/vim.ts` | Update types if renaming |

## Support & Questions

For questions about implementation:
- Check component comments in source code
- Review TypeScript types for data structures
- Check browser console for errors
- Verify Firebase configuration

---

**Created**: 2024
**Project**: VIM (Voice Identity Model)
**Purpose**: Migration guide for www.thestreamdisc.com integration

