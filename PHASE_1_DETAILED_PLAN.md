# Phase 1: AI Integration - Detailed Implementation Plan
## Replacing Deterministic Engine with Real ML Model

---

## Overview
**Duration:** 4-6 weeks  
**Goal:** Replace the functional prototype engine with a production-ready ML model for voice verification

---

## Week 1-2: Foundation & Research

### 1.1 ML Model Selection (Days 1-3)

#### Research Tasks
- [ ] Evaluate pre-trained models:
  - **Wav2Vec2** (Facebook) - General purpose, good baseline
  - **ECAPA-TDNN** (SpeechBrain) - State-of-the-art speaker verification
  - **SpeakerNet** (NVIDIA) - Optimized for production
  - **Resemblyzer** - Lightweight, easy integration
- [ ] Compare accuracy vs. latency trade-offs
- [ ] Evaluate licensing and costs
- [ ] Test model inference speed
- [ ] Check model size and deployment requirements

#### Decision Criteria
- Accuracy: Target >85% (Phase 1), >95% (Production)
- Latency: <500ms per verification
- Model size: <500MB for easy deployment
- License: Commercial use allowed
- Community support: Active maintenance

#### Recommendation Template
```markdown
Selected Model: [Model Name]
Reason: [Why this model]
Expected Accuracy: [%]
Expected Latency: [ms]
Deployment Method: [Cloud Run / Vertex AI / etc.]
```

### 1.2 Audio Processing Pipeline Design (Days 4-7)

#### Requirements
- [ ] Support formats: WAV, MP3, FLAC, M4A
- [ ] Standardize to: 16kHz, mono, 16-bit PCM
- [ ] Maximum duration: 10 seconds per sample
- [ ] Minimum duration: 1 second per sample
- [ ] Noise reduction: Optional but recommended
- [ ] Silence trimming: Automatic

#### Technology Stack
- **Audio Processing**: librosa (Python) or Web Audio API (client-side)
- **Format Conversion**: FFmpeg
- **Storage**: Firebase Storage or Cloud Storage
- **Processing**: Cloud Functions or Cloud Run

#### Implementation Plan
```python
# Example preprocessing pipeline
def preprocess_audio(audio_file):
    1. Load audio file
    2. Convert to mono if stereo
    3. Resample to 16kHz
    4. Normalize volume
    5. Trim silence
    6. Optional: Noise reduction
    7. Validate duration (1-10 seconds)
    8. Save processed file
    9. Return file path
```

### 1.3 Infrastructure Setup (Days 8-10)

#### Cloud Run Service Setup
- [ ] Create Cloud Run service
- [ ] Set up Docker container
- [ ] Configure environment variables
- [ ] Set up auto-scaling (min: 0, max: 10)
- [ ] Configure CPU/Memory (2 CPU, 4GB RAM initial)
- [ ] Set up Cloud IAM roles
- [ ] Configure VPC connector (if needed)
- [ ] Set up Cloud Logging

#### Storage Setup
- [ ] Create Firebase Storage bucket (or Cloud Storage)
- [ ] Set up security rules
- [ ] Configure CORS
- [ ] Set up lifecycle policies (delete after 90 days)
- [ ] Create folder structure:
  ```
  /voice-samples/{userId}/{sampleId}.wav
  /processed/{userId}/{sampleId}.wav
  /embeddings/{userId}/profile.emb
  ```

#### Database Schema Updates
- [ ] Add `voiceSamples` subcollection to user profile
- [ ] Add `embeddings` field (stored securely)
- [ ] Add `modelVersion` field
- [ ] Add `processingStatus` field

---

## Week 3-4: Implementation

### 2.1 Audio Upload System (Days 11-14)

#### Frontend Implementation
**File:** `app/voice-lock/setup/page.tsx`

- [ ] Add audio file input
- [ ] Add drag-and-drop support
- [ ] Add audio preview
- [ ] Add recording capability (optional)
- [ ] Add progress indicator
- [ ] Add file validation (format, size, duration)
- [ ] Add multiple file upload
- [ ] Show upload progress

#### API Endpoint
**File:** `app/api/voice-lock/upload/route.ts`

```typescript
POST /api/voice-lock/upload
Body: FormData with audio file
Response: {
  sampleId: string,
  status: "processing" | "completed" | "failed",
  message: string
}
```

#### Implementation Steps
1. Receive audio file
2. Validate file (format, size)
3. Upload to Firebase Storage
4. Trigger Cloud Function for processing
5. Return sample ID

### 2.2 Audio Processing Service (Days 15-18)

#### Cloud Function / Cloud Run Service
**File:** `services/audio-processor/main.py` (or similar)

```python
def process_audio(event, context):
    """
    Triggered by Cloud Storage upload
    Processes audio and generates embeddings
    """
    1. Download audio from Storage
    2. Preprocess audio (librosa)
    3. Extract embeddings (ML model)
    4. Store embeddings in Firestore
    5. Update processing status
    6. Clean up temporary files
```

#### Dependencies
```python
# requirements.txt
librosa==0.10.0
numpy==1.24.0
torch==2.0.0  # or tensorflow
speechbrain==0.5.14  # if using SpeechBrain
ffmpeg-python==0.2.0
```

### 2.3 ML Model Service (Days 19-21)

#### Cloud Run Service
**File:** `services/voice-lock-ml/main.py`

```python
from flask import Flask, request, jsonify
import torch
from model import VoiceLockModel

app = Flask(__name__)
model = VoiceLockModel.load()

@app.route('/health', methods=['GET'])
def health():
    return {'status': 'healthy'}

@app.route('/verify', methods=['POST'])
def verify():
    """
    Verify voice sample against user profile
    """
    data = request.json
    userId = data['userId']
    audioFile = data['audioFile']  # or audio embedding
    
    # Get user profile embeddings
    profile_embedding = get_profile_embedding(userId)
    
    # Extract embedding from input audio
    input_embedding = model.extract_embedding(audioFile)
    
    # Calculate similarity
    similarity = cosine_similarity(profile_embedding, input_embedding)
    
    # Map to grade
    grade = map_to_grade(similarity)
    
    # Generate serial
    serial = generate_serial(grade, similarity)
    
    return {
        'similarityScore': float(similarity),
        'grade': grade,
        'serial': serial
    }
```

#### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model files
COPY model/ ./model/
COPY services/voice-lock-ml/ ./

# Expose port
EXPOSE 8080

CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:8080", "main:app"]
```

### 2.4 Integration with Existing System (Days 22-24)

#### Update VoiceLock Engine
**File:** `lib/voiceLockEngine.ts`

```typescript
// Keep existing interface, replace implementation
export async function runVoiceLock(
  userId: string, 
  assetId: string,
  audioFile?: File | string
): Promise<VoiceLockResult> {
  // Call ML service instead of deterministic function
  const response = await fetch(process.env.ML_SERVICE_URL + '/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      assetId,
      audioFile: audioFile // if provided
    })
  });
  
  const result = await response.json();
  return {
    similarityScore: result.similarityScore,
    grade: result.grade,
    serial: result.serial
  };
}
```

#### Update API Route
**File:** `app/api/voice-lock/verify/route.ts`

- [ ] Add optional audio file upload
- [ ] Handle both text-based (assetId) and audio-based verification
- [ ] Add error handling for ML service failures
- [ ] Add fallback to deterministic engine (optional)

---

## Week 5-6: Testing & Optimization

### 3.1 Testing Strategy

#### Unit Tests
- [ ] Audio preprocessing functions
- [ ] Embedding extraction
- [ ] Similarity calculation
- [ ] Grade mapping

#### Integration Tests
- [ ] End-to-end verification flow
- [ ] Audio upload → processing → verification
- [ ] ML service health checks
- [ ] Error handling scenarios

#### Performance Tests
- [ ] Latency testing (<500ms target)
- [ ] Load testing (100 concurrent requests)
- [ ] Stress testing (1000+ requests)
- [ ] Memory usage monitoring

#### Accuracy Tests
- [ ] Test with real voice samples
- [ ] Measure false acceptance rate (FAR)
- [ ] Measure false rejection rate (FRR)
- [ ] Test with different audio qualities
- [ ] Test with background noise

### 3.2 Optimization

#### Model Optimization
- [ ] Model quantization (reduce size)
- [ ] Batch processing for multiple verifications
- [ ] Caching frequently used embeddings
- [ ] GPU acceleration (if needed)

#### Infrastructure Optimization
- [ ] Auto-scaling tuning
- [ ] Connection pooling
- [ ] CDN for model files
- [ ] Cost optimization

### 3.3 Monitoring Setup

#### Metrics to Track
- [ ] Verification accuracy
- [ ] Response time (p50, p95, p99)
- [ ] Error rate
- [ ] ML service uptime
- [ ] Cost per verification
- [ ] Model inference time

#### Alerts
- [ ] ML service down
- [ ] Accuracy drops below threshold
- [ ] Response time >1 second
- [ ] Error rate >5%

---

## Technical Specifications

### API Contracts

#### Upload Audio
```
POST /api/voice-lock/upload
Content-Type: multipart/form-data

Request:
  - file: Audio file (WAV, MP3, FLAC)
  - userId: string

Response:
{
  "sampleId": "sample_123",
  "status": "processing",
  "message": "Audio uploaded successfully"
}
```

#### Verify (with audio)
```
POST /api/voice-lock/verify
Content-Type: application/json

Request:
{
  "userId": "user_123",
  "assetId": "track_001",
  "audioFile": "base64_encoded_audio" // optional
}

Response:
{
  "verificationId": "ver_123",
  "similarityScore": 0.92,
  "grade": "A",
  "serial": "VL-A-092000",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Database Schema Updates

```typescript
// User profile subcollection
users/{userId}/voiceSamples/{sampleId}
{
  sampleId: string;
  fileUrl: string;
  processedUrl: string;
  duration: number;
  status: "uploaded" | "processing" | "completed" | "failed";
  createdAt: Timestamp;
  embedding?: number[]; // Optional, can be stored separately
}

// Profile embeddings (secure storage)
users/{userId}/voiceLockProfile/profile
{
  ...existing fields,
  embeddings: number[]; // Average of all sample embeddings
  modelVersion: string;
  lastUpdated: Timestamp;
}
```

### Environment Variables

```bash
# ML Service
ML_SERVICE_URL=https://voice-lock-ml-xxx.run.app
ML_SERVICE_TIMEOUT=5000

# Storage
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Processing
AUDIO_MAX_SIZE=10485760  # 10MB
AUDIO_MAX_DURATION=10    # seconds
AUDIO_MIN_DURATION=1    # seconds
```

---

## Success Criteria

### Functional
- ✅ Audio upload working
- ✅ Processing pipeline functional
- ✅ ML model integrated
- ✅ Verification working end-to-end
- ✅ Accuracy >85%

### Performance
- ✅ Upload time <5 seconds
- ✅ Processing time <30 seconds
- ✅ Verification time <500ms
- ✅ System handles 100 concurrent requests

### Quality
- ✅ Error rate <5%
- ✅ Uptime >99%
- ✅ All tests passing
- ✅ Documentation complete

---

## Rollback Plan

If ML integration fails:
1. Keep deterministic engine as fallback
2. Feature flag to switch between engines
3. Gradual rollout (10% → 50% → 100%)
4. Monitor metrics closely
5. Quick rollback capability (<5 minutes)

---

## Next Steps After Phase 1

1. **Phase 2 Preparation**
   - Collect real-world usage data
   - Identify edge cases
   - Plan anti-spoofing measures
   - Security audit

2. **Model Improvement**
   - Fine-tune on collected data
   - A/B test model improvements
   - Optimize for accuracy

3. **Scale Preparation**
   - Load testing results
   - Cost analysis
   - Infrastructure scaling plan

---

This detailed plan provides a week-by-week roadmap for Phase 1 implementation. Each task should be broken down into daily standups and tracked in your project management tool.

