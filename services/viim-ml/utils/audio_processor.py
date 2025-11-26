"""
Audio preprocessing pipeline for voice fingerprint system.
Handles audio format conversion, resampling, normalization, and silence trimming.
"""

import numpy as np
import librosa
import soundfile as sf
from io import BytesIO
from typing import Tuple


def preprocess_audio(audio_bytes: bytes, target_sr: int = 16000) -> Tuple[np.ndarray, int]:
    """
    Preprocess audio for ML model input.
    
    Args:
        audio_bytes: Raw audio file bytes (WAV, MP3, WebM, etc.)
        target_sr: Target sample rate (default: 16000 for ECAPA-TDNN)
    
    Returns:
        Tuple of (audio_array, sample_rate)
    
    Raises:
        ValueError: If audio is invalid or too short/long
    """
    # Load audio from bytes
    try:
        audio, sr = librosa.load(BytesIO(audio_bytes), sr=None, mono=True)
    except Exception as e:
        raise ValueError(f"Failed to load audio: {str(e)}")
    
    # Validate duration (1-10 seconds)
    duration = len(audio) / sr
    if duration < 1.0:
        raise ValueError(f"Audio too short: {duration:.2f}s (minimum 1s)")
    if duration > 10.0:
        raise ValueError(f"Audio too long: {duration:.2f}s (maximum 10s)")
    
    # Resample to target sample rate if needed
    if sr != target_sr:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr)
        sr = target_sr
    
    # Normalize amplitude to [-1, 1] range
    max_val = np.abs(audio).max()
    if max_val > 0:
        audio = audio / max_val
    
    # Trim silence from beginning and end
    audio, _ = librosa.effects.trim(audio, top_db=20)
    
    # Validate final duration after trimming
    final_duration = len(audio) / sr
    if final_duration < 0.5:
        raise ValueError(f"Audio too short after trimming: {final_duration:.2f}s")
    
    return audio, sr


def validate_audio_quality(audio: np.ndarray, sr: int) -> bool:
    """
    Validate audio quality metrics.
    
    Returns:
        True if audio meets quality requirements
    """
    # Check for sufficient energy (not just silence)
    energy = np.mean(audio ** 2)
    if energy < 0.001:
        return False
    
    # Check for reasonable dynamic range
    dynamic_range = np.max(audio) - np.min(audio)
    if dynamic_range < 0.1:
        return False
    
    return True

