# ML Service Setup Instructions

## Current Status
Your system is running low on disk space, which is preventing full package installation. Here's what you need to do:

## Option 1: Free Up Disk Space (Recommended)

1. **Clean Python cache:**
   ```bash
   pip cache purge
   ```

2. **Clean temp files:**
   - Delete files in `%TEMP%` folder
   - Empty Recycle Bin
   - Run Windows Disk Cleanup

3. **Then install dependencies:**
   ```bash
   cd services/viim-ml
   pip install -r requirements.txt
   ```

## Option 2: Install Critical Packages Only

If you can't free up space, try installing just the essentials:

```bash
cd services/viim-ml
pip install hyperpyyaml huggingface_hub sentencepiece --no-cache-dir
```

Then try starting the service:
```bash
python main.py
```

## Option 3: Use Stub Mode (For Testing UI)

If the ML service can't run, the system will fall back to stub mode. You can still test the UI, but won't get real embeddings.

## Starting the Service

Once packages are installed:

1. **Start the ML service:**
   ```bash
   cd services/viim-ml
   python main.py
   ```

2. **Verify it's running:**
   - Open browser: `http://localhost:8000/health`
   - Should return: `{"status":"healthy",...}`

3. **Set environment variable:**
   Create/update `.env.local` in project root:
   ```bash
   ML_SERVICE_URL=http://localhost:8000
   ```

4. **Restart Next.js:**
   ```bash
   npm run dev
   ```

## Testing

1. Go to `http://localhost:3000/viim/beta-test`
2. Click **"Test"** mode
3. Record audio
4. Should see real ML embeddings!

## Troubleshooting

### "No space left on device"
- Free up disk space (see Option 1)
- Or use stub mode for UI testing

### "ModuleNotFoundError"
- Install missing package: `pip install <package-name>`
- Check `requirements.txt` for all dependencies

### Service won't start
- Check Python version: `python --version` (needs 3.8+)
- Check if port 8000 is available
- Look for error messages in terminal

