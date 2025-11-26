# VIIM Voiceprint ML Service

Python FastAPI service for voice fingerprint embedding extraction using Hugging Face's ECAPA-TDNN model.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run Locally

```bash
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Test Endpoints

Health check:
```bash
curl http://localhost:8000/health
```

Extract embedding:
```bash
curl -X POST "http://localhost:8000/extract-embedding" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@test_audio.wav"
```

## API Endpoints

### GET /health
Health check endpoint.

### POST /extract-embedding
Extract 192-dimensional speaker embedding from audio file.

**Request:** multipart/form-data with `audio` file
**Response:**
```json
{
  "embedding": [0.123, 0.456, ...],
  "dimensions": 192,
  "audio_duration": 3.45
}
```

### POST /compute-similarity
Compute cosine similarity between two embeddings.

**Request:**
```json
{
  "embedding1": [0.123, ...],
  "embedding2": [0.456, ...]
}
```

**Response:**
```json
{
  "similarity": 0.85,
  "match": true,
  "threshold": 0.7
}
```

## Docker (Optional)

Build:
```bash
docker build -t viim-ml-service .
```

Run:
```bash
docker run -p 8000:8000 viim-ml-service
```

## Notes

- First request will download the model from Hugging Face (~100MB)
- Model is cached locally after first load
- Audio must be 1-10 seconds in duration
- Supports WAV, MP3, WebM formats

