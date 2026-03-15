# Recording Signer

This Cloud Run service generates short-lived Google Cloud Storage signed upload URLs for experiment recordings.

## Required environment

- `GCS_BUCKET=chaoran-agent-oversight-study-recording`
- `GCS_PREFIX=recordings/`
- `ALLOWED_ORIGINS=https://gui-agent-oversight.duckdns.org`
- `SIGNED_URL_TTL_SECONDS=900`

## Required IAM

Grant the Cloud Run runtime service account:

- `roles/storage.objectCreator` on the target bucket
- `roles/iam.serviceAccountTokenCreator` on the signing service account

Also enable:

- `run.googleapis.com`
- `cloudbuild.googleapis.com`
- `artifactregistry.googleapis.com`
- `iamcredentials.googleapis.com`

## Deploy

```bash
gcloud run deploy recording-signer \
  --source ./recording-signer \
  --region us-central1 \
  --allow-unauthenticated \
  --project nsf-2211428-61124 \
  --set-env-vars GCS_BUCKET=chaoran-agent-oversight-study-recording,GCS_PREFIX=recordings/,ALLOWED_ORIGINS=https://gui-agent-oversight.duckdns.org
```

After deploy, copy the service URL and replace `signerEndpoint` in [assets/scripts/recording-upload-config.js](/Users/chaoranchen/Documents/GitHub/oversight-experiment-websites/assets/scripts/recording-upload-config.js).

## Bucket CORS

Apply a CORS policy that allows browser `PUT` uploads from the study domain, for example:

```json
[
  {
    "origin": ["https://gui-agent-oversight.duckdns.org"],
    "method": ["PUT", "OPTIONS"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```
