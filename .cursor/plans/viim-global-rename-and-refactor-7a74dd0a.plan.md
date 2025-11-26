<!-- 7a74dd0a-db79-4a4d-88b1-5e5b9d2edcc4 32fc521e-4979-4923-8543-5974ea300104 -->
# Voice Fingerprint System Implementation

## Overview

Build a production-ready voice fingerprint system that:

- Enrolls users with 3-5 voice samples to create a unique voiceprint embedding
- Identifies users from new voice recordings using cosine similarity
- Uses Hugging Face's `speechbrain/spkrec-ecapa-voxceleb` pre-trained model
- Stores embeddings in Firestore as float arrays
- Runs ML processing in a separate Python service (local or Cloud Run)

## Architecture

```
Next.js App → Python ML Service (REST API) → Hugging Face Model
     ↓                                              ↓
Firestore (voiceprints, embeddings)         ECAPA-TDNN Embeddings
```

## Phase 1: Python ML Service Setup

### 1.1 Create Python Service Structure

**Files to create:**

- `services/viim-ml/requirements.txt` - Python dependencies
- `services/viim-ml/main.py` - FastAPI application
- `services/viim-ml/models/embedding_service.py` - Hugging Face model wrapper
- `services/viim-ml/utils/audio_processor.py` - Audio preprocessing
- `services/viim-ml/Dockerfile` - Containerization (optional for now)
- `services/viim-ml/.env.example` - Environment variables

**Dependencies:**

- fastapi, uvicorn (REST API)
- torch, speechbrain (ML model)
- librosa, soundfile (audio processing)
- numpy, scipy (vector operations)
- python-multipart (file uploads)

### 1.2 Implement Audio Preprocessing

**File:** `services/viim-ml/utils/audio_processor.py`

```python
def preprocess_audio(audio_bytes: bytes) -> np.ndarray:
    """
  1. Load audio from bytes (WAV/MP3/WebM)
  2. Convert to mono if stereo
  3. Resample to 16kHz (ECAPA-TDNN requirement)
  4. Normalize amplitude
  5. Trim silence
  6. Validate duration (1-10 seconds)
  7. Return numpy array
    """
```

### 1.3 Implement Embedding Service

**File:** `services/viim-ml/models/embedding_service.py`

```python
from speechbrain.inference.speaker import EncoderClassifier

class VoiceprintService:
    def __init__(self):
        self.model = EncoderClassifier.from_hf_source(
            "speechbrain/spkrec-ecapa-voxceleb"
        )
    
    def extract_embedding(self, audio: np.ndarray) -> np.ndarray:
        """Extract 192-dimensional embedding vector"""
        return self.model.encode_batch(audio)
    
    def compute_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Compute cosine similarity between embeddings"""
        return cosine_similarity(emb1, emb2)
```

### 1.4 Create REST API Endpoints

**File:** `services/viim-ml/main.py`

**POST /extract-embedding**

- Input: Audio file (multipart/form-data)
- Output: `{ "embedding": [float...], "dimensions": 192 }`
- Purpose: Extract embedding from audio (used by both enroll and verify)

**POST /compute-similarity**

- Input: `{ "embedding1": [float...], "embedding2": [float...] }`
- Output: `{ "similarity": 0.95, "match": true }`
- Purpose: Compare two embeddings (for verification)

## Phase 2: Firestore Schema Updates

### 2.1 Update TypeScript Types

**File:** `types/viim.ts`

Add new types:

```typescript
export type Voiceprint = {
  userId: string;
  voiceprintId: string;
  embedding: number[]; // 192-dimensional vector
  sampleCount: number; // Number of samples used (3-5)
  samples: VoiceprintSample[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  modelVersion: string; // "speechbrain/spkrec-ecapa-voxceleb"
};

export type VoiceprintSample = {
  sampleId: string;
  audioUrl: string; // Firebase Storage URL
  embedding: number[]; // Individual sample embedding
  duration: number; // seconds
  createdAt: Timestamp;
};

export type VoiceprintMatch = {
  userId: string;
  voiceprintId: string;
  similarity: number; // 0-1
  match: boolean; // similarity > threshold
  threshold: number;
  timestamp: Timestamp;
};
```

### 2.2 Update Firestore Functions

**File:** `lib/firestore.ts`

Add functions:

- `createVoiceprint(userId, embedding, samples[])` - Create new voiceprint
- `updateVoiceprint(userId, newEmbedding, newSample)` - Add sample and recompute average
- `getVoiceprint(userId)` - Get user's voiceprint
- `findMatchingVoiceprint(embedding, threshold)` - Find all matches above threshold
- `getAllVoiceprints()` - Get all voiceprints for batch operations

**Collection structure:**

```
voiceprints/{voiceprintId}
 - userId
 - embedding: [float...]
 - sampleCount
 - samples: subcollection
 - createdAt, updatedAt

voiceprints/{voiceprintId}/samples/{sampleId}
 - audioUrl
 - embedding: [float...]
 - duration
 - createdAt
```

## Phase 3: Next.js API Routes

### 3.1 Enrollment Endpoint

**File:** `app/api/viim/enroll/route.ts`

**POST /api/viim/enroll**

```typescript
Request: FormData
 - audio: File
 - userId: string

Response: {
  voiceprintId: string;
  sampleCount: number;
  status: "enrolled" | "sample_added";
  message: string;
}
```

**Flow:**

1. Receive audio file
2. Send to Python service `/extract-embedding`
3. Get embedding vector
4. Check if user has existing voiceprint

                                                                                                - If no: Create new voiceprint with this sample
                                                                                                - If yes and < 5 samples: Add sample, recompute average embedding
                                                                                                - If 5 samples: Return "enrollment complete"

5. Store in Firestore
6. Return response

### 3.2 Verification/Identification Endpoint

**File:** `app/api/viim/identify/route.ts`

**POST /api/viim/identify**

```typescript
Request: FormData
 - audio: File
 - threshold?: number (default: 0.7)

Response: {
  matches: Array<{
    userId: string;
    voiceprintId: string;
    similarity: number;
    match: boolean;
  }>;
  topMatch?: {
    userId: string;
    similarity: number;
  };
}
```

**Flow:**

1. Receive audio file
2. Send to Python service `/extract-embedding`
3. Get embedding vector
4. Query Firestore for all voiceprints
5. For each voiceprint, compute cosine similarity (server-side)
6. Filter matches above threshold
7. Sort by similarity
8. Return top matches

### 3.3 Update Fingerprint Endpoint

**File:** `app/api/viim/fingerprint/route.ts`

Update existing endpoint to:

- Call Python service for real embeddings
- Store embeddings in Firestore
- Return voiceprint ID instead of random string

## Phase 4: Backend Utility Functions

### 4.1 Cosine Similarity Function

**File:** `lib/voiceprintUtils.ts`

```typescript
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  // Compute dot product
  // Compute magnitudes
  // Return cosine similarity (0-1)
}

export function averageEmbeddings(embeddings: number[][]): number[] {
  // Average multiple embeddings into single voiceprint
}
```

### 4.2 Python Service Client

**File:** `lib/mlServiceClient.ts`

```typescript
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

export async function extractEmbedding(audioBlob: Blob): Promise<number[]> {
  // POST to Python service /extract-embedding
  // Return embedding vector
}

export async function computeSimilarity(
  emb1: number[],
  emb2: number[]
): Promise<number> {
  // POST to Python service /compute-similarity
  // Return similarity score
}
```

## Phase 5: Frontend Integration

### 5.1 Update Beta Test Page

**File:** `app/viim/beta-test/page.tsx`

- Add enrollment mode toggle
- Show enrollment progress (1/5, 2/5, etc.)
- After 3-5 samples, show "Enrollment Complete"
- Add identification mode: record → identify user
- Display match results with similarity scores

### 5.2 Create Enrollment Component

**File:** `components/viim/VoiceprintEnrollment.tsx`

- Multi-step enrollment UI
- Progress indicator
- Audio playback for each sample
- "Enroll Complete" confirmation

## Phase 6: Environment Setup

### 6.1 Environment Variables

**File:** `.env.local`

```bash
# ML Service
ML_SERVICE_URL=http://localhost:8000  # Local for dev
# ML_SERVICE_URL=https://viim-ml-xxx.run.app  # Cloud Run for prod

# Voiceprint Settings
VOICEPRINT_THRESHOLD=0.7
VOICEPRINT_MIN_SAMPLES=3
VOICEPRINT_MAX_SAMPLES=5
```

### 6.2 Python Service Setup

**File:** `services/viim-ml/README.md`

Instructions for:

- Local development setup
- Running with uvicorn
- Testing endpoints
- Docker build (optional)

## Implementation Order

1. **Week 1: Python ML Service**

                                                                                                - Set up Python project structure
                                                                                                - Implement Hugging Face model integration
                                                                                                - Create REST API endpoints
                                                                                                - Test locally

2. **Week 2: Firestore & Backend**

                                                                                                - Update Firestore schema
                                                                                                - Implement cosine similarity utilities
                                                                                                - Create ML service client
                                                                                                - Build enrollment/identification API routes

3. **Week 3: Frontend Integration**

                                                                                                - Update beta test page
                                                                                                - Add enrollment flow
                                                                                                - Add identification flow
                                                                                                - Test end-to-end

4. **Week 4: Testing & Optimization**

                                                                                                - Test with multiple users
                                                                                                - Tune similarity threshold
                                                                                                - Optimize embedding storage
                                                                                                - Document API contracts

## API Contracts

### POST /api/viim/enroll

```typescript
Request: FormData
  audio: File (WAV/MP3/WebM, 1-10 seconds)
  userId: string

Response: {
  voiceprintId: string;
  sampleCount: number;
  status: "enrolled" | "sample_added" | "complete";
  message: string;
  embedding?: number[]; // Optional, for debugging
}
```

### POST /api/viim/identify

```typescript
Request: FormData
  audio: File (WAV/MP3/WebM, 1-10 seconds)
  threshold?: number (default: 0.7)

Response: {
  matches: Array<{
    userId: string;
    voiceprintId: string;
    similarity: number;
    match: boolean;
  }>;
  topMatch?: {
    userId: string;
    voiceprintId: string;
    similarity: number;
  };
  processingTime: number;
}
```

## Success Criteria

- Users can enroll with 3-5 voice samples
- System creates unique voiceprint embedding per user
- New recordings can identify the correct user with >85% accuracy
- Similarity threshold properly distinguishes users
- All embeddings stored in Firestore
- Python service runs locally (zero cloud cost for MVP)
- API response time <2 seconds per request

### To-dos

- [x] Create Python ML service structure with FastAPI, requirements.txt, and Dockerfile
- [x] Implement audio preprocessing pipeline (resample, normalize, trim silence)
- [x] Integrate speechbrain/spkrec-ecapa-voxceleb model for embedding extraction
- [x] Create REST API endpoints: /extract-embedding and /compute-similarity
- [x] Update Firestore schema with Voiceprint and VoiceprintSample types
- [x] Implement Firestore functions: createVoiceprint, updateVoiceprint, findMatchingVoiceprint
- [x] Implement cosine similarity utility function for server-side matching
- [x] Create ML service client to call Python service from Next.js
- [x] Create POST /api/viim/enroll endpoint for voiceprint enrollment
- [x] Create POST /api/viim/identify endpoint for user identification
- [x] Update existing /api/viim/fingerprint to use real ML embeddings
- [x] Add enrollment mode to beta test page with 3-5 sample flow
- [x] Add identification mode to beta test page showing match results
- [x] Set up environment variables for ML service URL and thresholds