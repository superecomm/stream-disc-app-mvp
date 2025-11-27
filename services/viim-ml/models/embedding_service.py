"""
Voiceprint embedding service using Hugging Face's ECAPA-TDNN model.
Extracts 192-dimensional speaker embeddings from audio.
"""

import numpy as np
import os
os.environ.setdefault("TORCHAUDIO_BACKEND", "soundfile")

import torchaudio  # ensure present before SpeechBrain import
if not hasattr(torchaudio, "list_audio_backends"):
    torchaudio.list_audio_backends = lambda: []

from speechbrain.inference.speaker import EncoderClassifier
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class VoiceprintService:
    """
    Service for extracting speaker embeddings using ECAPA-TDNN model.
    """
    
    def __init__(self):
        """Initialize the service. Model loads lazily on first use."""
        self.model: Optional[EncoderClassifier] = None
        self._model_loading = False
        logger.info("VoiceprintService initialized (model will load on first request)")
    
    def _load_model(self):
        """Load the model if not already loaded (lazy loading)."""
        if self.model is None and not self._model_loading:
            try:
                self._model_loading = True
                logger.info("Loading ECAPA-TDNN model from Hugging Face (first request)...")
                self.model = EncoderClassifier.from_hf_source(
                    "speechbrain/spkrec-ecapa-voxceleb"
                )
                logger.info("Model loaded successfully")
                self._model_loading = False
            except Exception as e:
                self._model_loading = False
                logger.error(f"Failed to load model: {str(e)}")
                raise
    
    def extract_embedding(self, audio: np.ndarray) -> np.ndarray:
        """
        Extract speaker embedding from audio.
        
        Args:
            audio: Preprocessed audio array (1D numpy array, 16kHz)
        
        Returns:
            192-dimensional embedding vector
        """
        # Load model on first request (lazy loading)
        self._load_model()
        
        try:
            # Model expects shape: (batch, samples) or (samples,)
            # Add batch dimension if needed
            if audio.ndim == 1:
                audio = audio.unsqueeze(0) if hasattr(audio, 'unsqueeze') else np.expand_dims(audio, 0)
            
            # Convert to tensor if needed
            if isinstance(audio, np.ndarray):
                import torch
                audio_tensor = torch.from_numpy(audio).float()
            else:
                audio_tensor = audio
            
            # Extract embedding
            embedding = self.model.encode_batch(audio_tensor)
            
            # Convert to numpy and flatten
            if hasattr(embedding, 'numpy'):
                embedding = embedding.numpy()
            elif hasattr(embedding, 'detach'):
                embedding = embedding.detach().cpu().numpy()
            
            # Flatten to 1D array
            embedding = embedding.flatten()
            
            # Normalize embedding (L2 normalization)
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm
            
            return embedding.astype(np.float32)
        
        except Exception as e:
            logger.error(f"Failed to extract embedding: {str(e)}")
            raise ValueError(f"Embedding extraction failed: {str(e)}")
    
    def compute_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """
        Compute cosine similarity between two embeddings.
        
        Args:
            emb1: First embedding vector
            emb2: Second embedding vector
        
        Returns:
            Cosine similarity score (0-1, where 1 is identical)
        """
        # Ensure embeddings are normalized
        emb1_norm = emb1 / np.linalg.norm(emb1) if np.linalg.norm(emb1) > 0 else emb1
        emb2_norm = emb2 / np.linalg.norm(emb2) if np.linalg.norm(emb2) > 0 else emb2
        
        # Compute cosine similarity (dot product of normalized vectors)
        similarity = np.dot(emb1_norm, emb2_norm)
        
        # Clamp to [0, 1] range (should already be, but ensure)
        similarity = max(0.0, min(1.0, similarity))
        
        return float(similarity)
    
    def batch_extract(self, audio_batch: list[np.ndarray]) -> list[np.ndarray]:
        """
        Extract embeddings for multiple audio samples.
        
        Args:
            audio_batch: List of preprocessed audio arrays
        
        Returns:
            List of embedding vectors
        """
        embeddings = []
        for audio in audio_batch:
            embedding = self.extract_embedding(audio)
            embeddings.append(embedding)
        return embeddings

