"""
DuckDB database manager for storing recordings and embeddings.
"""

import duckdb
import os
from typing import Optional, List, Dict, Any
from datetime import datetime
import numpy as np
import logging
import json

logger = logging.getLogger(__name__)

# Database file path
DB_PATH = os.getenv("DUCKDB_PATH", "voiceprints.db")


class RecordingDatabase:
    """Manages DuckDB database for voice recordings and embeddings."""
    
    def __init__(self, db_path: str = DB_PATH):
        """Initialize database connection and create tables if needed."""
        self.db_path = db_path
        self.conn = duckdb.connect(db_path)
        self._create_tables()
    
    def _create_tables(self):
        """Create recordings table if it doesn't exist."""
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS recordings (
                recording_id VARCHAR PRIMARY KEY,
                user_id VARCHAR,
                filename VARCHAR,
                file_path VARCHAR,
                duration_seconds FLOAT,
                file_size_bytes INTEGER,
                sample_rate INTEGER,
                audio_format VARCHAR,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                mode VARCHAR,  -- 'test', 'enroll', 'identify'
                status VARCHAR,  -- 'completed', 'failed', 'processing'
                embedding ARRAY(FLOAT),  -- 192-dimensional vector
                embedding_dimensions INTEGER,
                voiceprint_id VARCHAR,
                similarity_score FLOAT,
                matched_user_id VARCHAR,
                metadata VARCHAR  -- Additional metadata as JSON string
            )
        """)
        
        # Create indexes for faster lookups
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_id ON recordings(user_id)
        """)
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_voiceprint_id ON recordings(voiceprint_id)
        """)
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_created_at ON recordings(created_at)
        """)
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_mode ON recordings(mode)
        """)
        
        logger.info("Database tables initialized")
    
    def insert_recording(
        self,
        recording_id: str,
        user_id: Optional[str],
        filename: str,
        file_path: Optional[str],
        duration_seconds: float,
        file_size_bytes: int,
        sample_rate: int,
        audio_format: str,
        mode: str,
        embedding: np.ndarray,
        voiceprint_id: Optional[str] = None,
        similarity_score: Optional[float] = None,
        matched_user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Insert a new recording record with embedding.
        
        Args:
            recording_id: Unique recording identifier
            user_id: User who made the recording (optional)
            filename: Original filename
            file_path: Path to stored audio file (optional)
            duration_seconds: Audio duration in seconds
            file_size_bytes: File size in bytes
            sample_rate: Audio sample rate (e.g., 16000)
            audio_format: Audio format (e.g., 'webm', 'wav')
            mode: Recording mode ('test', 'enroll', 'identify')
            embedding: 192-dimensional embedding vector
            voiceprint_id: Associated voiceprint ID (if enrolled)
            similarity_score: Similarity score (if identified)
            matched_user_id: Matched user ID (if identified)
            metadata: Additional metadata as dictionary
        
        Returns:
            True if successful
        """
        try:
            now = datetime.now()
            
            # Convert embedding to list for DuckDB
            embedding_list = embedding.tolist() if isinstance(embedding, np.ndarray) else embedding
            
            # Convert metadata to JSON string
            metadata_json = None
            if metadata:
                metadata_json = json.dumps(metadata)
            
            self.conn.execute("""
                INSERT INTO recordings (
                    recording_id, user_id, filename, file_path,
                    duration_seconds, file_size_bytes, sample_rate, audio_format,
                    created_at, updated_at, mode, status,
                    embedding, embedding_dimensions,
                    voiceprint_id, similarity_score, matched_user_id, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                recording_id,
                user_id,
                filename,
                file_path,
                duration_seconds,
                file_size_bytes,
                sample_rate,
                audio_format,
                now,
                now,
                mode,
                'completed',
                embedding_list,
                len(embedding_list),
                voiceprint_id,
                similarity_score,
                matched_user_id,
                metadata_json
            ])
            
            logger.info(f"Recording {recording_id} inserted into database")
            return True
            
        except Exception as e:
            logger.error(f"Failed to insert recording: {str(e)}")
            return False
    
    def get_recording(self, recording_id: str) -> Optional[Dict[str, Any]]:
        """Get a recording by ID."""
        try:
            result = self.conn.execute("""
                SELECT * FROM recordings WHERE recording_id = ?
            """, [recording_id]).fetchone()
            
            if result:
                return self._row_to_dict(result)
            return None
        except Exception as e:
            logger.error(f"Failed to get recording: {str(e)}")
            return None
    
    def get_user_recordings(
        self,
        user_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get all recordings for a user."""
        try:
            results = self.conn.execute("""
                SELECT * FROM recordings 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            """, [user_id, limit]).fetchall()
            
            return [self._row_to_dict(row) for row in results]
        except Exception as e:
            logger.error(f"Failed to get user recordings: {str(e)}")
            return []
    
    def get_recordings_by_voiceprint(
        self,
        voiceprint_id: str
    ) -> List[Dict[str, Any]]:
        """Get all recordings associated with a voiceprint."""
        try:
            results = self.conn.execute("""
                SELECT * FROM recordings 
                WHERE voiceprint_id = ? 
                ORDER BY created_at DESC
            """, [voiceprint_id]).fetchall()
            
            return [self._row_to_dict(row) for row in results]
        except Exception as e:
            logger.error(f"Failed to get voiceprint recordings: {str(e)}")
            return []
    
    def search_by_embedding(
        self,
        query_embedding: np.ndarray,
        threshold: float = 0.7,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search recordings by embedding similarity using cosine similarity.
        
        Note: DuckDB doesn't have built-in cosine similarity, so we'll
        need to compute it in Python after fetching embeddings.
        """
        try:
            # Get all recordings with embeddings
            results = self.conn.execute("""
                SELECT recording_id, user_id, embedding, created_at, mode, 
                       filename, duration_seconds, voiceprint_id
                FROM recordings 
                WHERE embedding IS NOT NULL
                ORDER BY created_at DESC
            """).fetchall()
            
            # Compute cosine similarity for each
            matches = []
            query_emb = query_embedding / np.linalg.norm(query_embedding) if np.linalg.norm(query_embedding) > 0 else query_embedding
            
            for row in results:
                stored_embedding = np.array(row[2])  # embedding column
                stored_emb_norm = stored_embedding / np.linalg.norm(stored_embedding) if np.linalg.norm(stored_embedding) > 0 else stored_embedding
                
                similarity = np.dot(query_emb, stored_emb_norm)
                
                if similarity >= threshold:
                    matches.append({
                        'recording_id': row[0],
                        'user_id': row[1],
                        'similarity': float(similarity),
                        'created_at': row[3].isoformat() if hasattr(row[3], 'isoformat') else str(row[3]),
                        'mode': row[4],
                        'filename': row[5],
                        'duration_seconds': row[6],
                        'voiceprint_id': row[7]
                    })
            
            # Sort by similarity and limit
            matches.sort(key=lambda x: x['similarity'], reverse=True)
            return matches[:limit]
            
        except Exception as e:
            logger.error(f"Failed to search by embedding: {str(e)}")
            return []
    
    def get_recent_recordings(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get most recent recordings."""
        try:
            results = self.conn.execute("""
                SELECT * FROM recordings 
                ORDER BY created_at DESC 
                LIMIT ?
            """, [limit]).fetchall()
            
            return [self._row_to_dict(row) for row in results]
        except Exception as e:
            logger.error(f"Failed to get recent recordings: {str(e)}")
            return []
    
    def _row_to_dict(self, row) -> Dict[str, Any]:
        """Convert database row to dictionary."""
        columns = [
            'recording_id', 'user_id', 'filename', 'file_path',
            'duration_seconds', 'file_size_bytes', 'sample_rate', 'audio_format',
            'created_at', 'updated_at', 'mode', 'status',
            'embedding', 'embedding_dimensions',
            'voiceprint_id', 'similarity_score', 'matched_user_id', 'metadata'
        ]
        result = dict(zip(columns, row))
        
        # Parse metadata JSON if present
        if result.get('metadata'):
            try:
                result['metadata'] = json.loads(result['metadata'])
            except:
                pass
        
        # Convert timestamps to ISO strings
        for key in ['created_at', 'updated_at']:
            if result.get(key) and hasattr(result[key], 'isoformat'):
                result[key] = result[key].isoformat()
        
        return result
    
    def close(self):
        """Close database connection."""
        self.conn.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

