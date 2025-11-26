"""
FastAPI service for voice fingerprint embedding extraction.
Provides REST API endpoints for ML model inference.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import logging
import os
import uuid
from datetime import datetime
from utils.audio_processor import preprocess_audio, validate_audio_quality
from models.embedding_service import VoiceprintService
from utils.database import RecordingDatabase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="VIIM Voiceprint ML Service",
    description="Voice fingerprint embedding extraction using ECAPA-TDNN",
    version="1.0.0"
)

# CORS middleware (allow Next.js to call this service)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize embedding service (lazy load on first request)
_embedding_service: Optional[VoiceprintService] = None

# Initialize database (lazy load on first request)
_database: Optional[RecordingDatabase] = None


def get_embedding_service() -> VoiceprintService:
    """Lazy initialization of embedding service."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = VoiceprintService()
    return _embedding_service


def get_database() -> RecordingDatabase:
    """Lazy initialization of database."""
    global _database
    if _database is None:
        _database = RecordingDatabase()
    return _database


# Response models
class EmbeddingResponse(BaseModel):
    embedding: List[float]
    dimensions: int
    audio_duration: float


class SimilarityRequest(BaseModel):
    embedding1: List[float]
    embedding2: List[float]


class SimilarityResponse(BaseModel):
    similarity: float
    match: bool
    threshold: float = 0.7


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "VIIM Voiceprint ML Service",
        "model": "speechbrain/spkrec-ecapa-voxceleb"
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    try:
        service = get_embedding_service()
        return {
            "status": "healthy",
            "model_loaded": True,
            "model_name": "speechbrain/spkrec-ecapa-voxceleb"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@app.post("/extract-embedding", response_model=EmbeddingResponse)
async def extract_embedding(
    audio: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
    mode: Optional[str] = Form(None),
    voiceprint_id: Optional[str] = Form(None)
):
    """
    Extract speaker embedding from audio file and optionally store in database.
    
    Args:
        audio: Audio file (WAV, MP3, WebM, etc.)
        user_id: Optional user ID for database storage
        mode: Optional mode ('test', 'enroll', 'identify')
        voiceprint_id: Optional voiceprint ID for enrollment
    
    Returns:
        Embedding vector (192 dimensions) and metadata
    """
    try:
        # Read audio file
        audio_bytes = await audio.read()
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        logger.info(f"Processing audio file: {audio.filename}, size: {len(audio_bytes)} bytes")
        
        # Preprocess audio
        audio_array, sample_rate = preprocess_audio(audio_bytes)
        
        # Validate audio quality
        if not validate_audio_quality(audio_array, sample_rate):
            raise HTTPException(
                status_code=400,
                detail="Audio quality too low (insufficient energy or dynamic range)"
            )
        
        # Extract embedding
        service = get_embedding_service()
        embedding = service.extract_embedding(audio_array)
        
        # Calculate duration
        duration = len(audio_array) / sample_rate
        
        logger.info(f"Extracted embedding: {len(embedding)} dimensions, duration: {duration:.2f}s")
        
        # Store in database if user_id or mode is provided (especially for enroll/identify)
        if (user_id or mode) and mode != "test":  # Store for enroll and identify, skip test by default
            try:
                db = get_database()
                recording_id = str(uuid.uuid4())
                
                # Determine audio format from filename
                audio_format = "webm"  # default
                if audio.filename:
                    ext = os.path.splitext(audio.filename)[1].lower().lstrip('.')
                    if ext in ['wav', 'mp3', 'ogg', 'm4a', 'flac']:
                        audio_format = ext
                
                # Store recording metadata
                db.insert_recording(
                    recording_id=recording_id,
                    user_id=user_id,
                    filename=audio.filename or f"recording_{recording_id}.{audio_format}",
                    file_path=None,  # We're not storing files, just metadata
                    duration_seconds=duration,
                    file_size_bytes=len(audio_bytes),
                    sample_rate=sample_rate,
                    audio_format=audio_format,
                    mode=mode or 'test',
                    embedding=embedding,
                    voiceprint_id=voiceprint_id,
                    metadata={
                        'source': 'ml_service',
                        'model': 'speechbrain/spkrec-ecapa-voxceleb',
                        'is_test': mode == 'test'
                    }
                )
                logger.info(f"Recording {recording_id} stored in database")
            except Exception as db_error:
                # Don't fail the request if database storage fails
                logger.warning(f"Failed to store recording in database: {str(db_error)}")
        elif mode == "test" and user_id:
            # Optionally store test recordings if user_id provided
            try:
                db = get_database()
                recording_id = str(uuid.uuid4())
                audio_format = "webm"
                if audio.filename:
                    ext = os.path.splitext(audio.filename)[1].lower().lstrip('.')
                    if ext in ['wav', 'mp3', 'ogg', 'm4a', 'flac']:
                        audio_format = ext
                
                db.insert_recording(
                    recording_id=recording_id,
                    user_id=user_id,
                    filename=audio.filename or f"recording_{recording_id}.{audio_format}",
                    file_path=None,
                    duration_seconds=duration,
                    file_size_bytes=len(audio_bytes),
                    sample_rate=sample_rate,
                    audio_format=audio_format,
                    mode='test',
                    embedding=embedding,
                    voiceprint_id=None,
                    metadata={
                        'source': 'ml_service',
                        'model': 'speechbrain/spkrec-ecapa-voxceleb',
                        'is_test': True
                    }
                )
                logger.info(f"Test recording {recording_id} stored in database")
            except Exception as db_error:
                logger.warning(f"Failed to store test recording in database: {str(db_error)}")
        
        return EmbeddingResponse(
            embedding=embedding.tolist(),
            dimensions=len(embedding),
            audio_duration=duration
        )
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error extracting embedding: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/compute-similarity", response_model=SimilarityResponse)
async def compute_similarity(request: SimilarityRequest, threshold: float = 0.7):
    """
    Compute cosine similarity between two embeddings.
    
    Args:
        request: Two embedding vectors
        threshold: Similarity threshold for match (default: 0.7)
    
    Returns:
        Similarity score and match status
    """
    try:
        # Convert to numpy arrays
        emb1 = np.array(request.embedding1, dtype=np.float32)
        emb2 = np.array(request.embedding2, dtype=np.float32)
        
        # Validate dimensions
        if len(emb1) != len(emb2):
            raise HTTPException(
                status_code=400,
                detail=f"Embedding dimension mismatch: {len(emb1)} vs {len(emb2)}"
            )
        
        # Compute similarity
        service = get_embedding_service()
        similarity = service.compute_similarity(emb1, emb2)
        
        return SimilarityResponse(
            similarity=similarity,
            match=similarity >= threshold,
            threshold=threshold
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error computing similarity: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# Search endpoint for finding nearest recordings
class SearchRequest(BaseModel):
    query_embedding: List[float]
    recording_id: Optional[str] = None  # Exclude this recording from results


@app.post("/recordings/search")
async def search_recordings(
    request: SearchRequest,
    threshold: float = Query(0.5, ge=0.0, le=1.0),
    limit: int = Query(3, ge=1, le=10)
):
    """
    Search recordings by embedding similarity.
    
    Args:
        request: Query embedding vector and optional recording_id to exclude
        threshold: Minimum similarity threshold (0.0-1.0, default: 0.5)
        limit: Maximum number of results (1-10, default: 3)
    
    Returns:
        List of matching recordings with similarity scores
    """
    try:
        db = get_database()
        query_emb = np.array(request.query_embedding, dtype=np.float32)
        
        # Search for matches
        matches = db.search_by_embedding(query_emb, threshold=threshold, limit=limit * 2)  # Get more to filter
        
        # Exclude the current recording if provided
        if request.recording_id:
            matches = [m for m in matches if m['recording_id'] != request.recording_id]
        
        # Limit to requested number
        matches = matches[:limit]
        
        return {
            "count": len(matches),
            "matches": matches
        }
    except Exception as e:
        logger.error(f"Error searching recordings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

