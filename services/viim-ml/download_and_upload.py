"""
Download ECAPA-TDNN model and upload to Cloud Storage.
This runs once to cache the model in GCS.
"""

import os
from speechbrain.inference.speaker import EncoderClassifier
from google.cloud import storage
import shutil
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
BUCKET_NAME = "app-streamdisc-ml-models"
MODEL_GCS_PATH = "ecapa-voxceleb/"
LOCAL_MODEL_DIR = "./model_cache"

def download_model():
    """Download ECAPA-TDNN model from HuggingFace."""
    logger.info("Downloading ECAPA-TDNN model from HuggingFace...")
    try:
        model = EncoderClassifier.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
            savedir=LOCAL_MODEL_DIR
        )
        logger.info(f"✓ Model downloaded to {LOCAL_MODEL_DIR}")
        return True
    except Exception as e:
        logger.error(f"Failed to download model: {e}")
        return False

def upload_to_gcs():
    """Upload model directory to Cloud Storage."""
    logger.info(f"Uploading model to gs://{BUCKET_NAME}/{MODEL_GCS_PATH}")
    
    try:
        client = storage.Client()
        bucket = client.bucket(BUCKET_NAME)
        
        # Walk through local directory and upload all files
        file_count = 0
        for root, dirs, files in os.walk(LOCAL_MODEL_DIR):
            for file in files:
                local_path = os.path.join(root, file)
                # Create GCS path relative to model dir
                relative_path = os.path.relpath(local_path, LOCAL_MODEL_DIR)
                gcs_path = os.path.join(MODEL_GCS_PATH, relative_path).replace('\\', '/')
                
                logger.info(f"Uploading {local_path} -> gs://{BUCKET_NAME}/{gcs_path}")
                blob = bucket.blob(gcs_path)
                blob.upload_from_filename(local_path)
                file_count += 1
        
        logger.info(f"✓ Uploaded {file_count} files to Cloud Storage")
        return True
        
    except Exception as e:
        logger.error(f"Failed to upload to GCS: {e}")
        return False

def main():
    """Main setup function."""
    logger.info("=" * 60)
    logger.info("ECAPA-TDNN Model Setup for Cloud Storage")
    logger.info("=" * 60)
    
    # Step 1: Download model
    if not download_model():
        logger.error("Setup failed at download step")
        exit(1)
    
    # Step 2: Upload to GCS
    if not upload_to_gcs():
        logger.error("Setup failed at upload step")
        exit(1)
    
    logger.info("=" * 60)
    logger.info("✓ Setup complete! Model is now in Cloud Storage")
    logger.info(f"  Location: gs://{BUCKET_NAME}/{MODEL_GCS_PATH}")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()

