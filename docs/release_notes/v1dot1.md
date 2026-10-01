**Full Changelog**: https://github.com/genidma/kaggle-google-CAPSTONE-june-2026/compare/v1.0...v1.1

# 🚀 MySupportBuddy v1.1 — Pause + Security Hardening

v1.1 pauses Cloud costs to pennies while hardening dependencies. No teardown — Firestore, project, and code preserved for instant revival.

---

## ⏸️ Pause to save $2/mo (#24 — CLOSED)

- Cloud Run service `mysupportbuddy` (`us-central1`) deleted — endpoint offline, redeployable in 1 command.
- Artifact Registry `cloud-run-source-deploy` in `us-central1` (~12GB) deleted — $2 source removed.
- `us-east1` repo (other app) kept untouched. Other GCP projects untouched. Firestore/project/code intact.
- Compute $0, storage pennies. Revival via `gcloud run deploy mysupportbuddy --source . ...` from README.
- Sanitized issue log with archival / re-revival / timemachine guide, no project IDs posted.

## 🔒 Security bumps since v1.0

| PR | Change | Alerts fixed |
|---|---|---|
| #23 | `pyasn1 0.6.3 → 0.6.4` | 3x high (DoS via OID/tag/Real) — now CLOSED |
| #25 | `anyio 4.14.1 → 4.14.2`, `cryptography 49.0.0 → 50.0.0` | 4x (anyio critical/high/medium, crypto high) — merged, awaiting rescan |
| #27 | `PyJWT 2.13.0 → 2.15.0`, `urllib3 2.7.0 → 2.8.0` | 16x (PyJWT critical/high/medium, urllib3 high/medium) — merged, awaiting rescan |
| #26 | Dependabot `pyjwt` bump closed as superseded by #27 | — |

Current pins: `anyio==4.14.2`, `cryptography==50.0.0`, `pyasn1==0.6.4`, `PyJWT==2.15.0`, `urllib3==2.8.0`.

---

## 🔄 Re-revival (1 command, from Cloud Shell, repo root)

```bash
gcloud config set project <PROJECT_ID>

gcloud run deploy mysupportbuddy \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_MODEL=gemini-2.5-flash" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest,JWT_SECRET=jwt-secret:latest"
```

Repo auto-recreates on deploy. Firestore data resumes as-is.

---

## 📦 Timemachine

- Code: `git fetch --tags && git checkout pause-2026-10-01` (pause point) or `v1.1` tag.
- Data (if exported): `gcloud firestore import gs://<BUCKET>/<DATE>`.
- History: Issue #24 sanitized comments + PRs #23, #25, #26, #27.

---

> 🤖 **Signed:** Muse Spark, powered by **Muse Spark**, with co-collaborator **@genidma**
> 📅 **Date/Time:** October 01, 2026 — 2:36 PM Eastern (ET) / 18:36 UTC
