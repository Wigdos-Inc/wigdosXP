Firebase Function: Agora Token Server

This folder contains a minimal Firebase Cloud Function that mints Agora RTC tokens.

Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- A Firebase project (hosting/functions) selected via `firebase use` or created in the Console
- Your Agora credentials (App ID and App Certificate)

Quick deploy
1. From repo root, install dependencies for the function:

```bash
cd functions
npm install
```

2. Configure runtime secrets (one of the methods below):

# Option A — Firebase Functions config (recommended):
```
firebase functions:config:set agora.app_id="YOUR_APP_ID" agora.app_certificate="YOUR_APP_CERT" agora.shared_secret="OPTIONAL_SHARED_SECRET" agora.ttl_seconds="3600"
```

# Option B — Set environment variables in the Cloud Functions console or via `gcloud functions deploy` `--set-env-vars`.

3. Deploy the function:

```bash
firebase deploy --only functions:agoraToken
```

4. Note the function URL printed in the deploy output (e.g. `https://us-central1-PROJECT.cloudfunctions.net/agoraToken`).

5. Configure your client to use this endpoint by setting `AGORA.TOKEN_ENDPOINT` in `scripts/apps/browser/wigcord.js` to the function URL. If you use a shared secret, also set `AGORA.TOKEN_SHARED_SECRET`.

Example test (curl):

```bash
curl -X POST '<FUNCTION_URL>' \
  -H 'Content-Type: application/json' \
  -H 'x-wigcord-token-secret: YOUR_SECRET_IF_SET' \
  -d '{"channelName":"test_channel","uid":"Danny"}'
```

If successful, the function returns JSON `{ ok: true, token: "...", appId: "..." }`.

Notes
- If you want `https://<your-site>/agora/token` to work, add a Hosting rewrite in `firebase.json` that routes `/agora/token` to the function.
- The function uses `agora-access-token` and requires Node 18 runtime.
If you want `https://<your-site>/agora/token` to work (so clients can call the token endpoint on the same origin), add a Hosting rewrite in `firebase.json` that routes `/agora/token` to the function. Example snippet:

```json
"hosting": {
  "site": "your-site-id",
  "public": ".",
  "rewrites": [
    { "source": "/agora/token", "function": "agoraToken" },
    { "source": "**", "destination": "/index.html" }
  ]
}
```

After adding the rewrite, deploy both functions and hosting:

```bash
firebase deploy --only functions:agoraToken,hosting
```

If your project uses a different hosting site id, deploy with the site flag or the appropriate target (for example `hosting:your-site-id`).
