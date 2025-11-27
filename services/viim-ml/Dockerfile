FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy pre-downloaded SpeechBrain model cache (from GCS) into image
COPY model_cache /tmp/model_cache
RUN mkdir -p /root/.cache/speechbrain/spkrec-ecapa-voxceleb \
    && cp -R /tmp/model_cache/. /root/.cache/speechbrain/spkrec-ecapa-voxceleb \
    && rm -rf /tmp/model_cache

ENV TORCHAUDIO_BACKEND=soundfile \
    SPEECHBRAIN_OFFLINE=True

# Copy application code
COPY . .

# Cloud Run will set PORT environment variable
ENV PORT 8080
EXPOSE 8080

# Run with uvicorn (single worker for better memory management)
CMD exec uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1 --timeout-keep-alive 300
