# Detailed Summary: Nearest Recordings Search & Comparison Feature

## Overview
This feature adds a search and comparison system for voice recordings. After a recording, users can find the 3 most similar past recordings and compare them side-by-side.

---

## Architecture & Components

### 1. Backend: Python ML Service (`services/viim-ml/main.py`)

#### Database Storage Integration
- **Modified `/extract-embedding` endpoint**:
  - Accepts optional form parameters: `user_id`, `mode`, `voiceprint_id`
  - Stores recordings in DuckDB when `user_id` and `mode` are provided
  - Storage behavior:
    - **Enroll mode**: Always stores (required for voiceprint creation)
    - **Identify mode**: Stores for future matching
    - **Test mode**: Stores only if `user_id` is provided (optional)
- **Database schema stores**:
  - Recording metadata (ID, user_id, filename, duration, sample_rate, format)
  - 192-dimensional embedding vector
  - Timestamps (created_at, updated_at)
  - Mode classification (test/enroll/identify)
  - Voiceprint association (if enrolled)
  - Additional metadata (JSON)

#### Search Endpoint (`POST /recordings/search`)
- **Accepts**:
  - `query_embedding`: 192-dimensional embedding vector (request body)
  - `recording_id`: Optional ID to exclude from results (request body)
  - `threshold`: Minimum similarity score (query param, default: 0.5)
  - `limit`: Maximum results (query param, default: 3, max: 10)
- **Process**:
  1. Retrieves all recordings with embeddings from DuckDB
  2. Computes cosine similarity between query embedding and each stored embedding
  3. Filters by threshold
  4. Excludes current recording if `recording_id` provided
  5. Sorts by similarity (descending)
  6. Returns top N matches with metadata
- **Returns**:
  - `count`: Number of matches found
  - `matches`: Array of matching recordings with:
    - `recording_id`, `user_id`, `similarity` (0-1)
    - `created_at`, `mode`, `filename`, `duration_seconds`, `voiceprint_id`

### 2. Next.js API Layer

#### Search API Route (`app/api/viim/recordings/search/route.ts`)
- Receives POST requests with embedding array
- Validates input
- Calls ML service search endpoint
- Returns formatted results to frontend
- Error handling for service unavailability

#### Updated API Routes
- **`/api/viim/enroll/route.ts`**:
  - Passes `user_id` and `mode="enroll"` to ML service
  - Retrieves existing voiceprint ID before extraction
  - Passes `voiceprint_id` for database association
- **`/api/viim/identify/route.ts`**:
  - Passes optional `user_id` and `mode="identify"` to ML service
  - Stores identification attempts for analysis
- **`/api/viim/fingerprint/route.ts`**:
  - Optionally accepts `user_id` and `mode` for test recordings
  - Stores test recordings if user_id provided

### 3. ML Service Client (`lib/mlServiceClient.ts`)

#### Updated Functions
- **`extractEmbedding()`**:
  - Added optional parameters: `userId?`, `mode?`, `voiceprintId?`
  - Appends parameters to FormData when provided
  - Maintains backward compatibility

#### New Function: `searchRecordings()`
- **Signature**: `searchRecordings(embedding, threshold?, limit?, recordingId?)`
- Calls ML service `/recordings/search` endpoint
- Returns typed `SearchResult` with matches array
- Error handling with descriptive messages

### 4. Frontend: Beta Test Page (`app/viim/beta-test/page.tsx`)

#### New State Management
- `currentRecordingAudioUrl`: Object URL for audio playback
- `currentRecordingEmbedding`: 192-dimensional embedding array
- `currentRecordingMetadata`: Timestamp, duration, mode, fingerprint
- `isSearching`: Loading state for search operation
- `nearestRecordings`: Array of matched recordings
- `showComparisonWindow`: Modal visibility control

#### Recording Storage Logic
- In `onAudioData` callback:
  - Creates object URL from audio blob: `URL.createObjectURL(audioBlob)`
  - Extracts embedding from API response:
    - Test mode: `data.embeddings` or `data.mlOutput.embeddings`
    - Enroll mode: `data.embedding`
    - Identify mode: Not directly available (would need separate extraction)
  - Stores metadata (timestamp, duration, mode, fingerprint)
  - All stored in component state for comparison

#### Find Nearest Recordings Button
- **Location**: Output section, after fingerprint display
- **Visibility**: Only when:
  - `fingerprintState === "complete"`
  - `modelConnected === true`
  - `currentRecordingEmbedding !== null`
- **Styling**: Blue button with Search icon, full-width
- **States**:
  - Default: "Find Nearest Recordings" with Search icon
  - Loading: "Searching..." with spinner
  - Disabled during search operation

#### Search Handler (`handleFindNearest`)
- Validates embedding exists
- Sets loading state
- Calls `/api/viim/recordings/search` with:
  - Current recording embedding
  - Threshold: 0.5
  - Limit: 3
- On success:
  - Stores results in state
  - Opens comparison window
  - Logs success message
- On error:
  - Displays error message
  - Logs to process terminal

#### Cleanup Logic
- `useEffect` hook revokes object URLs on unmount
- `handleReset` cleans up:
  - Audio URLs (prevents memory leaks)
  - Embedding data
  - Search results
  - Comparison window state

### 5. Comparison Window Component (`components/viim/RecordingComparisonWindow.tsx`)

#### Component Structure
- Modal overlay with dimmed background
- Fixed positioning (centered, z-index: 50)
- Responsive layout (max-width: 6xl, max-height: 90vh)
- Scrollable content area

#### Layout: Two-Column Grid

**Left Column: Current Recording**
- Title: "Current Recording"
- Large play button (64x64px, blue gradient)
- Play/pause toggle functionality
- HTML5 audio element with object URL
- Metadata display:
  - Timestamp (formatted: "Jan 15, 2024, 2:30 PM")
  - Duration (formatted: "M:SS")
  - Mode (capitalized: "Test", "Enroll", "Identify")
  - Fingerprint string (monospace, truncated)
- Styling: Blue border, gray background

**Right Column: Nearest Matches**
- Title: "Nearest Matches"
- Grid of match cards (up to 3)
- Each card displays:
  - Rank badge (1, 2, 3) with gradient background
  - Similarity score (large, bold percentage)
  - Similarity progress bar (visual indicator)
  - Play button placeholder ("Audio not available" - disabled)
  - Metadata:
    - User ID (truncated, monospace)
    - Created date (formatted)
    - Duration
    - Mode
- Styling: Gray background, border, responsive spacing

#### Audio Playback
- **Current recording**: Full playback support
  - Play/pause toggle
  - Auto-stop when other audio starts
  - Cleanup on component unmount
- **Matched recordings**: Placeholder (audio files not stored yet)
  - Disabled button with message
  - Ready for future implementation

#### Visual Design
- Color scheme: Blue/purple gradients for primary actions
- Typography: Clear hierarchy (titles, labels, values)
- Icons: Lucide React icons (Play, Pause, Clock, User, Calendar, Mic)
- Spacing: Consistent padding and margins
- Responsive: Adapts to screen size

---

## User Flow

### Step 1: Recording
1. User selects mode (Test/Enroll/Identify)
2. Clicks neural box to start recording
3. System:
   - Requests microphone access
   - Starts MediaRecorder
   - Displays recording animation
   - Shows timer
4. User clicks again to stop recording
5. System:
   - Stops MediaRecorder
   - Creates audio blob
   - Shows "Processing..." state

### Step 2: Processing & Storage
1. Audio blob sent to appropriate API endpoint:
   - Test → `/api/viim/fingerprint`
   - Enroll → `/api/viim/enroll`
   - Identify → `/api/viim/identify`
2. Backend processing:
   - Converts audio to blob
   - Calls ML service `/extract-embedding`
   - ML service:
     - Preprocesses audio (resample, normalize, trim)
     - Extracts 192-dimensional embedding
     - Stores in DuckDB (if user_id and mode provided)
     - Returns embedding and metadata
3. Frontend receives response:
   - Extracts embedding from response
   - Creates object URL from audio blob
   - Stores in component state
   - Displays fingerprint and ML output
   - Shows "complete" state

### Step 3: Finding Nearest Recordings
1. User clicks "Find Nearest Recordings" button
2. System validates:
   - Embedding exists
   - ML service connected
3. Search request:
   - POST to `/api/viim/recordings/search`
   - Payload: `{ embedding: [...], threshold: 0.5, limit: 3 }`
4. Backend processing:
   - Next.js route validates input
   - Calls ML service `/recordings/search`
   - ML service:
     - Queries DuckDB for all recordings with embeddings
     - Computes cosine similarity for each
     - Filters by threshold (≥0.5)
     - Sorts by similarity (descending)
     - Returns top 3 matches
5. Frontend receives results:
   - Stores matches in state
   - Opens comparison window
   - Displays loading → success state

### Step 4: Comparison Window
1. Modal opens with dimmed background
2. Left side: Current recording
   - Play button (ready to play)
   - Metadata display
3. Right side: Top 3 matches
   - Rank badges (1, 2, 3)
   - Similarity scores (e.g., "87.3%")
   - Progress bars showing similarity
   - Metadata for each match
   - Placeholder play buttons
4. User interactions:
   - Play current recording
   - View similarity scores
   - Compare metadata
   - Close window (X button or click outside)

### Step 5: Cleanup
- On window close: Modal dismissed, state preserved
- On new recording: Previous audio URLs revoked, new recording stored
- On component unmount: All audio URLs cleaned up

---

## Technical Details

### Database Storage Logic
- **Automatic storage when**:
  - `user_id` provided AND
  - `mode` is "enroll" or "identify"
- **Optional storage** for test mode if `user_id` provided
- Each recording gets unique UUID
- Embeddings stored as float arrays in DuckDB
- Indexes on `user_id`, `voiceprint_id`, `created_at`, `mode`

### Similarity Calculation
- **Method**: Cosine similarity
- **Formula**: `similarity = dot(query_norm, stored_norm)`
- **Normalization**: Both vectors normalized before dot product
- **Threshold**: 0.5 (configurable, 0.0-1.0)
- **Result**: Float between -1 and 1 (typically 0-1 for voice embeddings)

### Error Handling
- ML service unavailable: Graceful fallback, error message displayed
- No matches found: Empty state in comparison window
- Invalid embedding: Validation error, request rejected
- Database errors: Logged but don't fail request
- Network errors: User-friendly error messages

### Performance Considerations
- Lazy database initialization (first request)
- Efficient similarity computation (vectorized numpy operations)
- Object URL cleanup (prevents memory leaks)
- Limited search results (max 10, default 3)
- Indexed database queries (fast lookups)

---

## Future Enhancements (Not Implemented)

1. **Audio file storage**: Store actual audio files for matched recordings
2. **Playback for matches**: Enable audio playback for matched recordings
3. **Advanced filtering**: Filter by date range, user, mode
4. **Batch comparison**: Compare multiple recordings at once
5. **Export functionality**: Export comparison results
6. **Visualization**: Waveform displays, embedding visualizations
7. **Analytics**: Similarity trends over time

---

## Files Modified/Created

### Created:
- `app/api/viim/recordings/search/route.ts`
- `components/viim/RecordingComparisonWindow.tsx`

### Modified:
- `services/viim-ml/main.py`
- `lib/mlServiceClient.ts`
- `app/viim/beta-test/page.tsx`
- `app/api/viim/enroll/route.ts`
- `app/api/viim/identify/route.ts`
- `app/api/viim/fingerprint/route.ts`

---

## Summary

This feature adds a search and comparison system for voice recordings. Users can find similar past recordings and compare them side-by-side, with similarity scores and metadata. The system stores recordings in DuckDB, uses cosine similarity for matching, and provides a modal interface for comparison. The implementation includes error handling, cleanup, and a responsive UI.

