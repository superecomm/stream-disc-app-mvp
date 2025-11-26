# Backend Voice Processing Flow

## Complete Request Flow

```
Frontend (Browser)
    ↓ (POST /api/viim/fingerprint with audio file)
Next.js API Route (app/api/viim/fingerprint/route.ts)
    ↓ (extractEmbedding(audioBlob))
ML Service Client (lib/mlServiceClient.ts)
    ↓ (HTTP POST to Python service)
Python ML Service (services/viim-ml/main.py)
    ↓ (preprocess_audio → extract_embedding)
ECAPA-TDNN Model (services/viim-ml/models/embedding_service.py)
    ↓ (192-dimensional embedding vector)
Response back through chain
```

## Step-by-Step Code Flow

### 1. Frontend Sends Audio
**File:** `app/viim/beta-test/page.tsx`
- User records audio → `audioBlob` created
- FormData created with audio file
- POST request to `/api/viim/fingerprint`

### 2. Next.js API Route Receives Audio
**File:** `app/api/viim/fingerprint/route.ts`

```typescript
// Line 10-11: Receive audio file
const formData = await request.formData();
const audioFile = formData.get("audio") as File;

// Line 21: Check ML service health
modelConnected = await checkMLServiceHealth();

// Line 38-40: Convert to Blob
const audioBlob = new Blob([await audioFile.arrayBuffer()], {
  type: audioFile.type,
});

// Line 43: Call ML service to extract embedding
const embeddingResponse = await extractEmbedding(audioBlob);
```

### 3. ML Service Client Makes HTTP Request
**File:** `lib/mlServiceClient.ts`

```typescript
// Line 27-37: Send audio to Python service
export async function extractEmbedding(audioBlob: Blob) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  
  const response = await fetch(`${ML_SERVICE_URL}/extract-embedding`, {
    method: "POST",
    body: formData,
  });
  
  const data = await response.json();
  return data; // { embedding: [192 numbers], dimensions: 192, audio_duration: 3.45 }
}
```

### 4. Python Service Receives and Preprocesses
**File:** `services/viim-ml/main.py`

```python
# Line 92-112: FastAPI endpoint receives audio
@app.post("/extract-embedding")
async def extract_embedding(audio: UploadFile = File(...)):
    # Read audio bytes
    audio_bytes = await audio.read()
    
    # Preprocess audio (resample, normalize, trim)
    audio_array, sample_rate = preprocess_audio(audio_bytes)
    
    # Validate quality
    if not validate_audio_quality(audio_array, sample_rate):
        raise HTTPException(...)
```

### 5. Audio Preprocessing
**File:** `services/viim-ml/utils/audio_processor.py`

```python
# Line 13-58: Preprocess audio
def preprocess_audio(audio_bytes: bytes, target_sr: int = 16000):
    # Load audio from bytes (supports WAV, MP3, WebM, etc.)
    audio, sr = librosa.load(BytesIO(audio_bytes), sr=None, mono=True)
    
    # Validate duration (1-10 seconds)
    # Resample to 16kHz (ECAPA-TDNN requirement)
    # Normalize amplitude to [-1, 1]
    # Trim silence
    
    return audio, sr  # numpy array, 16kHz
```

### 6. Extract Embedding with ML Model
**File:** `services/viim-ml/models/embedding_service.py`

```python
# Line 31-75: Extract 192-dimensional embedding
def extract_embedding(self, audio: np.ndarray) -> np.ndarray:
    # Convert to tensor
    audio_tensor = torch.from_numpy(audio).float()
    
    # Run through ECAPA-TDNN model
    embedding = self.model.encode_batch(audio_tensor)
    
    # Convert to numpy, flatten, normalize
    embedding = embedding.detach().cpu().numpy().flatten()
    embedding = embedding / np.linalg.norm(embedding)  # L2 normalize
    
    return embedding  # 192-dimensional vector
```

### 7. Response Returns to Next.js
**File:** `services/viim-ml/main.py`

```python
# Line 130-134: Return embedding
return EmbeddingResponse(
    embedding=embedding.tolist(),  # Convert to list
    dimensions=len(embedding),      # 192
    audio_duration=duration        # seconds
)
```

### 8. Next.js Processes Response
**File:** `app/api/viim/fingerprint/route.ts`

```typescript
// Line 44: Get embedding from response
const embedding = embeddingResponse.embedding; // [192 numbers]

// Line 48-52: Generate fingerprint string from embedding
const embeddingHash = embedding
  .slice(0, 16)
  .map((v) => Math.abs(v).toString(36).substring(2, 4))
  .join("");
const fingerprint = `sd_${embeddingHash}_${Date.now()...}`;

// Line 56-69: Return to frontend
return NextResponse.json({
  fingerprint,
  embeddings: embedding,
  mlModel: "speechbrain/spkrec-ecapa-voxceleb",
  modelConnected: true,
  mlOutput: { embeddingDimensions: 192, ... }
});
```

## Key Functions

### Enrollment Flow (`/api/viim/enroll`)
1. Receives audio + userId
2. Calls `extractEmbedding()` → gets 192-dim vector
3. Creates/updates voiceprint in Firestore
4. Averages embeddings if multiple samples
5. Returns enrollment status

### Identification Flow (`/api/viim/identify`)
1. Receives audio
2. Calls `extractEmbedding()` → gets 192-dim vector
3. Calls `findMatchingVoiceprints()` → compares against all stored voiceprints
4. Uses cosine similarity (server-side)
5. Returns matches above threshold

## Data Structures

### Audio Input
- Format: WebM (from browser MediaRecorder)
- Converted to: Blob → bytes → numpy array
- Processed to: 16kHz mono, normalized, trimmed

### Embedding Output
- Dimensions: 192 (from ECAPA-TDNN)
- Type: float32 array
- Normalized: L2 normalized (unit vector)
- Stored in: Firestore as `number[]` array

### Voiceprint Storage
```typescript
{
  userId: string,
  voiceprintId: string,
  embedding: number[192],  // Averaged from 3-5 samples
  sampleCount: number,
  samples: VoiceprintSample[],
  modelVersion: "speechbrain/spkrec-ecapa-voxceleb"
}
```

