# Cloud Run Reset – 2025-11-28

**Scope**

- Deleted Cloud Run services `stream-disc-app` and `viim-ml-service` in project `app-streamdisc`.
- SpeechBrain weights remain in `gs://app-streamdisc-ml-models`.
- Source repo reflects the latest ML URL sanitization logic (`lib/mlBaseUrl.ts`).

**Next Deploy Steps**

1. **ML Service**
   - `cd services/viim-ml`
   - `gcloud builds submit --tag gcr.io/$PROJECT_ID/viim-ml-service .`
   - `gcloud run deploy viim-ml-service --region us-central1 --allow-unauthenticated --memory 4Gi --cpu 4 --timeout 600 --min-instances 1 --set-env-vars MODEL_BUCKET=app-streamdisc-ml-models`
2. **Next.js App**
   - `npm run build`
   - `gcloud run deploy stream-disc-app --source . --region us-central1 --allow-unauthenticated --set-env-vars ML_SERVICE_URL=https://<viim-ml-service-url>`
3. **Verification**
   - Hit `/viim/beta-test` on the new frontend URL.
   - Confirm logs show `[ML] base URL raw: … → cleaned: …` without warnings.

**Notes**

- Keep `ML_SERVICE_URL` free of path segments (`/extract-embedding`) and auxiliary text.
- `NEXT_PUBLIC_ML_SERVICE_URL` should remain unset in Cloud Run; client-side reads use the sanitized helper.
- If additional services existed (e.g., Firebase functions), redeploy separately once the two critical Cloud Run services are stable.

