Cloudflare Worker: Agora Token Endpoint

This worker provides a lightweight `/agora/token` endpoint that mints Agora RTC tokens.

Prerequisites
- Install Wrangler (Cloudflare CLI): `npm install -g wrangler`
- A Cloudflare account and a configured Cloudflare Worker namespace / service.

Files added
- `cloudflare-worker/index.js` — Worker script that accepts POST /agora/token and returns JSON `{ ok:true, token, appId }`.
- `cloudflare-worker/package.json` — lists `agora-access-token` dependency.

How it works
- The worker expects these environment bindings (set via `wrangler secret put` or `wrangler.toml`):
  - `AGORA_APP_ID` — your Agora App ID
  - `AGORA_APP_CERTIFICATE` — your Agora App Certificate (keep secret)
  - `AGORA_TOKEN_SHARED_SECRET` — optional shared secret to protect token endpoint
  - `AGORA_TOKEN_TTL_SECONDS` — optional TTL (default 3600)

Deploy (recommended with Wrangler)
1. From this folder, install dependencies (optional — Wrangler will bundle for you):
```bash
cd cloudflare-worker
npm install
```

2. Configure secrets (recommended):
```bash
# set interactively; do not commit these
wrangler secret put AGORA_APP_ID
wrangler secret put AGORA_APP_CERTIFICATE
wrangler secret put AGORA_TOKEN_SHARED_SECRET
```

3. Publish the worker (assumes you have `wrangler.toml` configured):
```bash
wrangler publish
```

Notes
- The script uses `agora-access-token`; Wrangler/esbuild should bundle it. If bundling errors occur due to node builtins, install a small polyfill or use the `format: 'service-worker'` build option.
- After publishing, set `AGORA.TOKEN_ENDPOINT` in `scripts/apps/browser/wigcord.js` to `https://<your-worker-domain>/agora/token` or use the same-origin `/agora/token` if you configure a proxy/route.

Security
- Keep `AGORA_APP_CERTIFICATE` secret. Use `wrangler secret put` or Cloudflare dashboard to store the value.
- Use `AGORA_TOKEN_SHARED_SECRET` to reject unauthenticated requests from unknown origins.
# WigTube Cloudflare Worker Setup

Single, simple guide to connect WigTube to a Cloudflare Worker that uploads videos to your GitHub repo.

This uses the file `cloudflare-worker/wigtube-upload-worker.js` and **one setting in your browser**.

**New**: Now supports files of any size via automatic chunked uploads!

---

## 1. Create a GitHub Token (1–2 minutes)

You need a Personal Access Token so the worker can push files to your repo.

1. Open this URL:
  - https://github.com/settings/tokens/new
2. Set:
  - **Token name**: `WigTube Upload`
  - **Expiration**: whatever you like (longer is easier)
3. Under scopes, tick:
  - **`repo`** (full control is simplest for now)
4. Click **Generate token**.
5. **Copy the token** (starts with `ghp_...`). You will not see it again.

You will paste this into Cloudflare in the next step as `GITHUB_TOKEN`.

---

## 2. Create and Deploy the Worker (3–4 minutes)

### 2.1 Create a Worker in Cloudflare

1. Go to:
  - https://dash.cloudflare.com
2. Sign up / log in (free plan is enough).
3. In the left menu, click **Workers & Pages**.
4. Click **Create** → **Create Worker**.
5. Name it: `wigtube-upload` (or anything you like).
6. Click **Deploy**, then click **Edit code**.

### 2.2 Paste the Worker Code

1. In VS Code, open:
  - `cloudflare-worker/wigtube-upload-worker.js`
2. Select all and copy the entire file.
3. In the Cloudflare editor, delete any existing code.
4. Paste the copied code.
5. Click **Save and Deploy**.

If deployment is successful, you will see a URL like:

`https://wigtube-upload.YOUR_SUBDOMAIN.workers.dev`

Keep this open; you’ll need it in step 3.

### 2.3 Configure Environment Variables

1. In the Worker view, go to the **Settings** tab.
2. Click **Variables** (or **Environment variables**).
3. Add these **Environment variables** (plain text, not secrets is fine here):

  - `GITHUB_TOKEN` = your `ghp_...` token from step 1
  - `GITHUB_OWNER` = `Danie-GLR`
  - `GITHUB_REPO`  = `Videoswigtube-EEEEEE`
  - `GITHUB_BRANCH` = `main`

4. Save the variables.

That’s all the backend config done.

---

## 3. Tell WigTube Which Worker to Use (30 seconds)

Now you just point the frontend at your Worker URL.

1. Open WigTube in your browser (the main app page).
2. Press **F12** to open DevTools.
3. Go to the **Console** tab.
4. Run this (replace with your actual Worker URL):

```javascript
localStorage.setItem('wigtubeWorkerUrl', 'https://wigtube-upload.YOUR_SUBDOMAIN.workers.dev');
```

5. Verify it saved:

```javascript
localStorage.getItem('wigtubeWorkerUrl');
```

You should see your full Worker URL as the output.

6. Refresh the page:

```javascript
location.reload();
```

From now on, WigTube will send uploads to that Cloudflare Worker instead of any local server.

---

## 4. Test That Everything Works

### 4.1 Quick Health Check (optional)

In a terminal or browser:

```bash
curl https://wigtube-upload.YOUR_SUBDOMAIN.workers.dev/health
```

Expected JSON:

```json
{"status":"ok","service":"wigtube-upload"}
```

### 4.2 Upload a Small Test File

1. Open the WigTube upload page.
2. Pick a small video or any file (a few MB).
3. Click upload.

If the setup is correct:
- The progress/status text in WigTube will advance.
- No CORS errors appear in the browser console.
- The file appears in your repo under:
  - `https://github.com/Danie-GLR/Videoswigtube-EEEEEE/tree/main/videos`

Once that works, you can try your real ~80MB videos.

---

## 5. How It Connects (Mental Model)

- **Browser (WigTube)** sends the file to: `https://wigtube-upload....workers.dev/upload` (or `/upload-chunk` for large files).
- **Cloudflare Worker** (code in `wigtube-upload-worker.js`) receives the file and:
  - **Small files (<50MB)**: Uses GitHub Contents API for single-request upload.
  - **Large files (≥50MB)**: Splits into 5MB chunks, uploads each chunk as a Git blob, then combines them into the final file.
  - Uses `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` to call the GitHub API.
  - Creates/updates the file in the `videos/` folder in your repo.
- **Worker response** returns a JSON object with `videoUrl` and other info.
- **WigTube** uses that `videoUrl` to play the video.

No ports, no Codespaces visibility, no custom CORS config, no file size limits.

---

## 6. Common Problems and Quick Fixes

### "Cloudflare Worker not configured!" (from WigTube)

Cause: `wigtubeWorkerUrl` in `localStorage` is missing or still the placeholder URL.

Fix:
```javascript
localStorage.setItem('wigtubeWorkerUrl', 'https://wigtube-upload.YOUR_SUBDOMAIN.workers.dev');
location.reload();
```

### 401 / 403 from GitHub in Worker logs

Cause: Bad or missing `GITHUB_TOKEN`, or wrong scopes.

Fix:
- Recreate the token with at least the `repo` scope.
- Update `GITHUB_TOKEN` in the Worker’s environment variables.

### 404 "File not found" when deleting

Cause: The file name doesn’t exist in `videos/` in the repo.

Fix:
- Check that the file actually exists under `videos/`.
- Ensure you didn’t manually rename it only on GitHub.

### CORS errors in browser

If the Worker is deployed with the code from `wigtube-upload-worker.js`, CORS is already allowed for `*`.

Most common real causes:
- Typo in the Worker URL in `localStorage`.
- Worker failed to deploy (check Cloudflare dashboard & logs).

### "Worker exceeded memory limit" in logs

**This issue is now fixed** - the Worker automatically uses chunked uploads for large files, so memory limits are no longer a problem.

If you still see this error, make sure you've deployed the latest Worker code from `cloudflare-worker/wigtube-upload-worker.js`.

### Chunked upload taking a long time

Large files (>50MB) are automatically split into 5MB chunks and uploaded sequentially. An 80MB file will have 16 chunks, which might take a few minutes depending on your connection speed.

Progress is shown in WigTube during upload: "Uploading chunk 1/16...", "Uploading chunk 2/16...", etc.

---

## 7. Summary

What you need to remember:

1. One GitHub token with `repo` access.
2. One Cloudflare Worker with the code from `wigtube-upload-worker.js`.
3. One config setting in `scripts/apps/browser/wigtube-config.js`:

```javascript
window.WIGTUBE_CONFIG.workerUrl = 'https://wigtube-upload.YOUR_SUBDOMAIN.workers.dev';
```

After that, WigTube uploads work from Codespaces, Firebase Hosting, or anywhere else:
- Files <50MB use simple upload (fast, single request)
- Files ≥50MB use chunked upload (automatic, no size limit)

