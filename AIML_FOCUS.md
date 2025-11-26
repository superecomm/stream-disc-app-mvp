# AI/ML Voice Fingerprinting - Focus Document

## Current Status

**App Launch**: Now redirects to `/viim/beta-test` - the transparent voice fingerprinting pipeline.

**Original Homepage**: Saved in `app/homepage-original.tsx` for future use.

## Beta Test Page Features

The beta test page (`app/viim/beta-test/page.tsx`) is a comprehensive voice fingerprinting test lab with three main modes:

### 1. **Test Mode** (Focus Area)
- **Input**: Voice recording via microphone
- **Process**: Real-time audio processing with ML model
- **Output**: Voice fingerprint (embedding) + ML model output

**Purpose**: Test the core AI/ML fingerprinting functionality

**Flow**:
```
User clicks box → Records audio → Sends to /api/viim/fingerprint → 
ML Service processes → Returns fingerprint + embeddings
```

### 2. **Enroll Mode**
- Enrolls new voice profiles
- Requires 5 sample recordings
- Creates voiceprint for identification

### 3. **Identify Mode**
- Identifies speakers from enrolled voices
- Compares against dataset
- Returns similarity scores and matches

## Key Components

### Visual Pipeline (3-Column Layout)

1. **Input (Left)**
   - Interactive neural box animation
   - Click to record
   - Visual feedback during recording
   - Enrollment progress tracking

2. **Process Log (Middle)**
   - Real-time process terminal
   - Shows all steps:
     - Microphone access
     - Recording status
     - Backend communication
     - ML model connection
     - Embedding generation
     - Results

3. **Output (Right)**
   - ML Model connection status
   - Voice fingerprint display
   - ML output details (embedding dimensions)
   - Identification results
   - History of previous recordings

## API Endpoints

### `/api/viim/fingerprint` (Test Mode)
- **Method**: POST
- **Input**: Audio blob (WebM format)
- **Output**:
  ```json
  {
    "fingerprint": "hash_string",
    "mlOutput": {
      "embeddingDimensions": 192,
      "acousticFeatures": {...}
    },
    "modelConnected": true,
    "mlModel": "speechbrain/spkrec-ecapa-voxceleb",
    "confidence": 0.95,
    "processingTime": 1234
  }
  ```

### `/api/viim/enroll` (Enrollment)
- **Method**: POST
- **Input**: Audio blob + userId
- **Output**:
  ```json
  {
    "message": "Sample 1/5 recorded",
    "sampleCount": 1,
    "voiceprintId": "uuid",
    "status": "in_progress",
    "embedding": [float array],
    "mlModel": "speechbrain/spkrec-ecapa-voxceleb"
  }
  ```

### `/api/viim/identify` (Identification)
- **Method**: POST
- **Input**: Audio blob
- **Output**:
  ```json
  {
    "topMatch": {
      "userId": "uuid",
      "voiceprintId": "uuid",
      "similarity": 0.87,
      "match": true
    },
    "matches": [...],
    "threshold": 0.7,
    "embeddingDimensions": 192
  }
  ```

## ML Service Integration

### Current Setup
- **ML Service**: Python FastAPI service at `services/viim-ml/`
- **Model**: ECAPA-TDNN from SpeechBrain
- **Embeddings**: 192-dimensional voice vectors
- **Similarity**: Cosine similarity for matching

### ML Service Endpoints
- `POST /embed` - Generate voice embeddings
- `GET /health` - Service health check

### Connection Flow
```
Next.js API Route → ML Service Client → Python ML Service → 
ECAPA-TDNN Model → Voice Embeddings → Response
```

## Focus Areas for AI/ML Development

### 1. **Voice Input Quality**
- [ ] Optimize audio capture settings
- [ ] Add noise reduction
- [ ] Implement audio preprocessing
- [ ] Support multiple audio formats

### 2. **Fingerprint Generation**
- [x] Basic ECAPA-TDNN embeddings working
- [ ] Fine-tune model parameters
- [ ] Add quality metrics
- [ ] Implement confidence scoring
- [ ] Test with various voice types

### 3. **Output Quality**
- [ ] Improve embedding consistency
- [ ] Add visualization of embeddings
- [ ] Show feature extraction details
- [ ] Display acoustic features

### 4. **ML Service Optimization**
- [ ] Reduce processing latency
- [ ] Add caching for repeated voices
- [ ] Implement batch processing
- [ ] Deploy to Cloud Run
- [ ] Add monitoring and logging

## Testing Workflow

### Quick Test
1. Open app → redirects to `/viim/beta-test`
2. Select "Test" mode
3. Click the neural box to record
4. Speak for 3-5 seconds
5. Click again to stop
6. View fingerprint output

### Enrollment Test
1. Select "Enroll" mode
2. Record 5 voice samples
3. View voiceprint ID
4. Check history

### Identification Test
1. Select "Identify" mode
2. Record voice sample
3. View similarity scores
4. Check matches against enrolled voices

## Development Commands

```bash
# Run dev server
npm run dev

# Run ML service
cd services/viim-ml
python main.py

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## Next Steps

1. **Deploy ML Service to Cloud Run**
   - Dockerize the Python service
   - Deploy to Google Cloud Run
   - Update `NEXT_PUBLIC_ML_SERVICE_URL`

2. **Optimize Voice Processing**
   - Fine-tune ECAPA-TDNN model
   - Add audio preprocessing pipeline
   - Implement quality checks

3. **Enhance UI/UX**
   - Add real-time waveform visualization
   - Show embedding space visualization
   - Improve error handling

4. **Testing & Validation**
   - Test with various voice types
   - Measure accuracy and consistency
   - Benchmark processing time
   - Test in production environment

## Key Files

- `app/viim/beta-test/page.tsx` - Main test interface
- `app/api/viim/fingerprint/route.ts` - Fingerprint API
- `app/api/viim/enroll/route.ts` - Enrollment API
- `app/api/viim/identify/route.ts` - Identification API
- `lib/mlServiceClient.ts` - ML service client
- `lib/viimEngine.ts` - VIIM processing engine
- `services/viim-ml/main.py` - ML service server
- `services/viim-ml/models/embedding_service.py` - Embedding generation

---

**Current Focus**: Get the AI/ML function working on input voice and output fingerprint
**Status**: Beta test page is live and ready for ML service testing
**Repository**: https://github.com/superecomm/stream-disc-app-mvp

