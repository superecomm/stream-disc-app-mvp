# VIIM ML Service Setup Guide

## Quick Start

### 1. Install Python Dependencies

```bash
cd services/viim-ml
pip install -r requirements.txt
```

**Note:** First-time setup will download the ECAPA-TDNN model from Hugging Face (~100MB). This happens automatically on first run.

### 2. Run the Service

```bash
# Option 1: Direct Python
python main.py

# Option 2: Uvicorn (recommended for development)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The service will be available at `http://localhost:8000`

### 3. Test the Service

```bash
# Health check
curl http://localhost:8000/health

# Extract embedding (requires audio file)
curl -X POST "http://localhost:8000/extract-embedding" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@test_audio.wav"
```

## Environment Variables

Create a `.env` file in `services/viim-ml/` (optional):

```bash
PORT=8000
HOST=0.0.0.0
DEFAULT_SIMILARITY_THRESHOLD=0.7
```

## Next.js Integration

Update your `.env.local` in the project root:

```bash
ML_SERVICE_URL=http://localhost:8000
```

## Troubleshooting

### Model Download Issues
If the model fails to download, it will be cached in `~/.cache/huggingface/`. You can manually download it or check your internet connection.

### Port Already in Use
Change the port in `main.py` or use:
```bash
uvicorn main:app --port 8001
```

### Audio Processing Errors
- Ensure audio is 1-10 seconds in duration
- Supported formats: WAV, MP3, WebM, FLAC
- Audio will be automatically resampled to 16kHz

## Production Deployment

For production, deploy to Cloud Run or similar:

```bash
# Build Docker image
docker build -t viim-ml-service .

# Run container
docker run -p 8000:8000 viim-ml-service
```

Update `ML_SERVICE_URL` in production environment to point to your deployed service.

