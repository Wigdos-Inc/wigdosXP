# Agora microphone troubleshooting & recommended edits

Short guide: how to inspect low-audio warnings, add minimal logging, and tune `SPEAKING_LEVEL_THRESHOLD`.

Symptoms
- Warnings in the browser console: `AUDIO_INPUT_LEVEL_TOO_LOW` (2001) and `SEND_AUDIO_BITRATE_TOO_LOW` (2003).
- The UI indicator that highlights a user when they speak (the "card turns blue") doesn't trigger.

Quick checks
1. Confirm browser microphone permission for the site.
2. Verify the correct input device is selected and system input volume/gain is non-zero.
3. Test microphone with another app or use `https://webrtc.github.io/samples/src/content/getusermedia/volume/`.

How this client decides "speaking"
- The client listens for Agora's `volume-indicator` events and compares `entry.level` against `this._c.AGORA.SPEAKING_LEVEL_THRESHOLD`.
- Mismatch in numeric scale (0..1 vs 0..100) or a too-high threshold will prevent detection.

Exact edits (recommended)
- File: [scripts/apps/browser/wigcord.js](scripts/apps/browser/wigcord.js)

Replace the current `volume-indicator` handler with the snippet below. This adds a lightweight debug log and auto-scales the configured threshold to match the observed `entry.level` scale.

```js
// inside _ensureAgoraClient(), replace the existing handler
this._agoraClient.enableAudioVolumeIndicator();
this._agoraClient.on('volume-indicator', (volumes) => {
  // Debug log so you can inspect the raw levels in DevTools
  if (typeof console !== 'undefined' && console.debug) {
    console.debug('[Agora volume-indicator]', volumes);
  }

  (volumes || []).forEach((entry) => {
    const uid = String(entry.uid);
    const rawLevel = Number(entry.level || 0);

    // Use configured threshold but auto-convert if scales are mismatched
    let threshold = Number(this._c.AGORA.SPEAKING_LEVEL_THRESHOLD || 0);
    if (threshold > 1 && rawLevel <= 1) {
      // configured as 0..100 but incoming level is 0..1
      threshold = threshold / 100;
    } else if (threshold <= 1 && rawLevel > 1) {
      // configured as 0..1 but incoming level is 0..100
      threshold = threshold * 100;
    }

    const isSpeaking = rawLevel >= threshold;
    this._markSpeakingState(uid, isSpeaking);
  });
});
```

Recommended thresholds
- If `entry.level` logs show values in the 0..1 range: set `SPEAKING_LEVEL_THRESHOLD` to about `0.05` (good starting range: `0.02`–`0.12`).
- If `entry.level` logs show values in the 0..100 range: set `SPEAKING_LEVEL_THRESHOLD` to about `5` (starting range: `3`–`12`).

Where to change the config
- Edit the AGORA config block near the top of `scripts/apps/browser/wigcord.js` and set `SPEAKING_LEVEL_THRESHOLD`:

```js
AGORA: {
  ENABLED: true,
  APP_ID: '...',
  TOKEN_ENDPOINT: '',
  TOKEN_SHARED_SECRET: '',
  PTT_KEY: 'Alt',
  SPEAKING_LEVEL_THRESHOLD: 0.05, // or 5
  ...
},
```

Testing steps
1. Start the token server and local services (if needed):

```bash
bash scripts/api/ensure-servers-running.sh
```

Token endpoint behavior on public hosting

- The client now defaults `AGORA.TOKEN_ENDPOINT` to the same-origin path `/agora/token`. That means on the live site `https://wigdos-inc.web.app` the client will first attempt `https://wigdos-inc.web.app/agora/token` (no port required). This makes it simple to use a Hosting rewrite, a serverless function, or a Cloudflare Worker to serve tokens from the same origin.

- If the same-origin endpoint isn't available the client still falls back to other development candidates (for example `http://localhost:3010/agora/token` when running locally). You can also override the token endpoint at runtime using the browser console:

```js
localStorage.setItem('wigcordAgoraTokenEndpoint','https://your-token-endpoint.example/agora/token');
location.reload();
```

- To configure the client permanently, set `TOKEN_ENDPOINT` in the AGORA config near the top of `scripts/apps/browser/wigcord.js`:

```js
AGORA: {
  TOKEN_ENDPOINT: 'https://your-worker.example.workers.dev/agora/token',
  TOKEN_SHARED_SECRET: 'optional-secret-if-configured',
  ...
}
```

- Cloudflare Worker option: this repository includes a lightweight Cloudflare Worker scaffold at `cloudflare-worker/index.js` that implements `/agora/token`. Deploy the worker, store your Agora App Certificate as a secret (see `wrangler secret put AGORA_APP_CERTIFICATE`), and then point the client at the worker URL or rely on a same-origin rewrite.

Example curl test (include shared secret header if configured):

```bash
curl -X POST 'https://wigdos-inc.web.app/agora/token' \
  -H 'Content-Type: application/json' \
  -H 'x-wigcord-token-secret: YOUR_SECRET_IF_SET' \
  -d '{"channelName":"test_channel","uid":"Danny"}'
```

If successful, the endpoint returns JSON `{ ok: true, token: "...", appId: "..." }`.

2. Open the app in your browser, open DevTools → Console, then join a voice channel and speak.
3. Look for `"[Agora volume-indicator]"` logs and note the numeric `entry.level` values for your microphone.
4. Adjust `SPEAKING_LEVEL_THRESHOLD` per the recommendations above and reload.

Notes on `SEND_AUDIO_BITRATE_TOO_LOW`
- This is often a network or encoder issue. Try a stable network (wired or strong Wi‑Fi) and ensure the local machine is not heavily CPU bound.
- If the network is good but bitrate still low, consider changing encoder settings or consult Agora docs for advanced audio constraints.

If you want, I can apply the code changes automatically and add a toggle to enable/disable the debug log at runtime. If you'd like that, reply "apply patch" and I'll make the edit now.
