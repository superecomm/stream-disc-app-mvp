# Quick Start Guide - ML Service

## Step 1: Start the Python ML Service

Open a **new terminal window** and run:

```bash
cd services/viim-ml
pip install -r requirements.txt
python main.py
```

**First time setup:**
- This will download the ECAPA-TDNN model from Hugging Face (~100MB)
- Takes 2-5 minutes on first run
- Model is cached after first download

**You should see:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Loading ECAPA-TDNN model from Hugging Face...
INFO:     Model loaded successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Step 2: Verify Service is Running

In another terminal, test the service:

```bash
curl http://localhost:8000/health
```

Should return:
```json
{"status":"healthy","model_loaded":true,"model_name":"speechbrain/spkrec-ecapa-voxceleb"}
```

## Step 3: Update Environment Variables

Create or update `.env.local` in the project root:

```bash
ML_SERVICE_URL=http://localhost:8000
```

## Step 4: Restart Next.js Dev Server

If your Next.js server is running, restart it to pick up the new environment variable:

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 5: Test in Browser

1. Go to `http://localhost:3000/viim/beta-test`
2. Click **"Test"** mode (first button)
3. Press the box to record
4. Say "1212" or anything
5. Press again to stop
6. You should see the ML model process the audio!

## Troubleshooting

### "ML service unavailable"
- Make sure Python service is running on port 8000
- Check `http://localhost:8000/health` in browser
- Verify `.env.local` has `ML_SERVICE_URL=http://localhost:8000`

### "fetch failed"
- Python service might not be running
- Check firewall isn't blocking port 8000
- Try restarting both services

### Model download issues
- Check internet connection
- Model downloads to `~/.cache/huggingface/`
- Can take 5-10 minutes on slow connections

### Port 8000 already in use
Change the port in `services/viim-ml/main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)
```
Then update `.env.local`:
```bash
ML_SERVICE_URL=http://localhost:8001
```

