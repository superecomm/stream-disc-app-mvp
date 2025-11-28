<!-- 2b5f445a-efba-470d-8667-d3abb31b49c2 ea3218d5-a21a-4d87-bd88-bb95e4e38fd8 -->
# Runtime ML URL Refactor

## Steps

1. **Add runtime helper** – Update `lib/mlBaseUrl.ts` to export `resolveMlBaseUrl()` that reads env vars only when called, strips `/extract-embedding`, logs in non-prod, and does not compute at module scope.
2. **Refactor API routes** – For each ML-calling route (`app/api/viim/enroll`, `fingerprint`, `identify`, `recordings/search`, plus any others discovered), remove top-level constants, call `resolveMlBaseUrl()` inside handlers, and build URLs per request.
3. **Update shared client** – Ensure `lib/mlServiceClient.ts` (and other server utilities) import and call `resolveMlBaseUrl()` at runtime, removing any cached constants or `NEXT_PUBLIC` references.
4. **Verify & redeploy** – Run `npm run build` locally, redeploy Cloud Run with only `ML_SERVICE_URL` set, then smoke-test `/viim/beta-test` and confirm logs show the clean endpoint.

## Todos

- helper-update: Implement resolveMlBaseUrl runtime helper.
- route-refactor: Update all ML API routes to call helper per request.
- client-update: Point shared ML client/utilities to the helper and remove NEXT_PUBLIC usage.
- deploy-verify: Build, redeploy with ML_SERVICE_URL, smoke-test beta page.