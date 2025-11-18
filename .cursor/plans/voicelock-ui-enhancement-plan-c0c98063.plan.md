<!-- c0c98063-3709-4f03-8222-4426c0f7494d 3357ba0b-2581-4cf8-aeb4-d0ac9150b998 -->
# VoiceLock UI Enhancement Plan

## Milestone 1: Enhanced Vertical Scrolling "Lyrics Lane"

### Current State

- `ReadingLane.tsx` displays full phrases with basic fade animations
- Shows previous/current/next phrases but not syllable-level granularity
- Manual tap-to-advance only

### Changes Required

**File: `components/ReadingLane.tsx`**

- Add word-level parsing logic for reading phrases (Scripts 1-3): split by spaces
- Keep Solfege items as single units (no splitting needed - already single syllables)
- Implement smooth upward scrolling animation (Guitar Hero style)
- Enhance visual hierarchy:
- Current item: Large, bold, black (text-4xl or larger)
- Previous item: Faded, smaller, positioned above
- Next item: Dimmed, positioned below
- Add fade-out at top and fade-in at bottom effects
- Support both single-item display (Solfege) and word-by-word display (reading phrases)

**File: `lib/phrases.ts`**

- Add helper function `splitPhraseIntoWords(phrase: string): string[]` for reading phrases
- Solfege phrases remain as-is (already single items)
- No English syllable-splitting required

## Milestone 2: Sweeping Progress Ring + Pulsing Animation

### Current State

- `RecordButton.tsx` has basic progress ring that updates continuously
- No syllable-based jumping animation
- Mic icon doesn't pulse to beat

### Changes Required

**File: `components/RecordButton.tsx`**

- Add `onSyllableComplete` callback prop to trigger ring jump
- Modify progress calculation to jump ~12.5% per syllable (or dynamic based on total)
- Add pulsing animation to inner mic icon (CSS keyframe animation synced to visual rhythm)
- Enhance sweep ring animation:
- Smooth circular sweep that jumps on syllable completion
- Visual feedback that matches syllable timing
- Ensure red background state is maintained during recording

**File: `app/voice-lock/read/page.tsx`**

- Pass syllable completion callback to `RecordButton`
- Track syllable progress and trigger ring updates

## Milestone 3: Mode-Specific Instructions

### Current State

- Static "Ready to start reading" message in `ReadingLane.tsx`
- No mode-aware messaging

### Changes Required

**File: `components/ReadingLane.tsx`**

- Add `mode` or `testType` prop to determine instruction text
- Implement mode-specific messages:
- Solfege: "Follow the scrolling notes and sing each syllable naturally."
- Voice reading: "Ready to start reading"
- Video: "Get ready to capture your natural voice on camera"
- Update instruction display logic based on current mode

**File: `app/voice-lock/read/page.tsx`**

- Pass `selectedMode` or `testType` to `ReadingLane` component

## Milestone 4: Syllable Auto-Advance (MVP Simulation)

### Current State

- Manual tap-to-advance only
- No automatic progression

### Changes Required

**File: `app/voice-lock/read/page.tsx`**

- Add auto-advance timer (2 seconds per syllable)
- Implement `useEffect` hook that:
- Starts timer when recording begins
- Advances to next syllable every 2 seconds
- Triggers animations (glow → scroll → ring advance)
- Respects manual advancement (cancel auto-advance if user taps)
- Add configuration for auto-advance per mode (Solfege vs reading phrases)
- Ensure smooth transition between auto and manual modes

**File: `components/ReadingLane.tsx`**

- Support both auto and manual advancement
- Add visual indicators for auto-advance mode

## Milestone 5: Enhanced Completion Card/Modal

### Current State

- `SessionCompleteModal.tsx` shows basic session summary
- Generic completion message

### Changes Required

**File: `components/SessionCompleteModal.tsx`**

- Add mode-specific completion messages:
- Solfege: "Solfege Test Complete - Your voice sample has been added to your VoiceLock dataset."
- Reading: "Reading Session Complete - Your voice sample has been added to your VoiceLock dataset."
- Enhance progress bar display (ex: "8% dataset complete")
- Update CTA buttons:
- "Record another" (stays on same page, resets)
- "Continue" (proceeds to next step)
- Ensure Firestore session log is updated (verify in `app/api/voice-lock/session/route.ts`)

**File: `app/voice-lock/read/page.tsx`**

- Pass test type/mode to completion modal
- Update modal trigger logic to show mode-specific content

## Implementation Order

1. **Milestone 3** (Mode-Specific Instructions) - Quick win, establishes foundation
2. **Milestone 1** (Enhanced Lyrics Lane) - Core visual experience
3. **Milestone 4** (Auto-Advance) - Interactivity layer
4. **Milestone 2** (Progress Ring) - Visual feedback enhancement
5. **Milestone 5** (Completion Modal) - Polish and user feedback

## Technical Considerations

- Ensure animations are performant (use CSS transforms, not layout properties)
- Maintain accessibility (keyboard navigation, screen reader support)
- Test on mobile devices (touch interactions, performance)
- Consider adding animation preferences (reduce motion for accessibility)
- Ensure syllable parsing handles edge cases (punctuation, special characters)

### To-dos

- [ ] Add mode-specific instruction text to ReadingLane component based on selected mode/test type
- [ ] Create helper function to split phrases into syllables/words for display in lyrics lane
- [ ] Enhance ReadingLane with Guitar Hero-style scrolling: large current syllable, faded previous above, dimmed next below, smooth upward animation
- [ ] Implement 2-second auto-advance timer for syllables with manual override capability
- [ ] Add syllable-based progress ring jumping animation (~12.5% per syllable or dynamic calculation)
- [ ] Add CSS keyframe animation to make mic icon pulse to visual rhythm during recording
- [ ] Update SessionCompleteModal with mode-specific messages and enhanced progress display