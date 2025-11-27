"""
Script to download ECAPA-TDNN model and upload to Cloud Storage.
Run this once to cache the model.
"""

import os
from speechbrain.inference.speaker import EncoderClassifier
import shutil

# Download model to local cache
print("Downloading ECAPA-TDNN model from HuggingFace...")
model = EncoderClassifier.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb",
    savedir="./model_cache"
)
print("Model downloaded successfully to ./model_cache")

print("\nModel files:")
for root, dirs, files in os.walk("./model_cache"):
    for file in files:
        filepath = os.path.join(root, file)
        size = os.path.getsize(filepath)
        print(f"  {filepath} ({size:,} bytes)")

print("\nNext steps:")
print("1. Upload to Cloud Storage:")
print("   gcloud storage cp -r ./model_cache gs://app-streamdisc-ml-models/ecapa-voxceleb/")
print("\n2. Deploy ML service (will use cached model)")

