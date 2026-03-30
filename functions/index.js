const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { RtcRole, RtcTokenBuilder } = require('agora-access-token');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const AGORA_APP_ID = process.env.AGORA_APP_ID || (functions.config && functions.config().agora && functions.config().agora.app_id) || '';
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || (functions.config && functions.config().agora && functions.config().agora.app_certificate) || '';
const AGORA_TOKEN_TTL_SECONDS = Number(process.env.AGORA_TOKEN_TTL_SECONDS || (functions.config && functions.config().agora && functions.config().agora.ttl_seconds) || 3600);
const AGORA_TOKEN_SHARED_SECRET = process.env.AGORA_TOKEN_SHARED_SECRET || (functions.config && functions.config().agora && functions.config().agora.shared_secret) || '';

function isValidIdentifier(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 64) return false;
  return /^[A-Za-z0-9_\-]+$/.test(trimmed);
}

function authorizeRequest(req) {
  if (!AGORA_TOKEN_SHARED_SECRET) return true;
  const headerSecret = req.get('x-wigcord-token-secret');
  return typeof headerSecret === 'string' && headerSecret === AGORA_TOKEN_SHARED_SECRET;
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'agora-token-server', appIdConfigured: !!AGORA_APP_ID, certificateConfigured: !!AGORA_APP_CERTIFICATE });
});

app.post('/', (req, res) => {
  if (!authorizeRequest(req)) return res.status(401).json({ ok: false, error: 'Unauthorized token request.' });

  if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    return res.status(500).json({ ok: false, error: 'Agora token server not configured.' });
  }

  const { uid, channelName } = req.body || {};
  if (!isValidIdentifier(uid)) return res.status(400).json({ ok: false, error: 'Invalid uid.' });
  if (!isValidIdentifier(channelName)) return res.status(400).json({ ok: false, error: 'Invalid channelName.' });

  const now = Math.floor(Date.now() / 1000);
  const privilegeExpireTs = now + AGORA_TOKEN_TTL_SECONDS;

  try {
    const token = RtcTokenBuilder.buildTokenWithAccount(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpireTs,
      privilegeExpireTs
    );

    return res.json({ ok: true, appId: AGORA_APP_ID, channelName, uid, token, expiresAt: privilegeExpireTs, ttlSeconds: AGORA_TOKEN_TTL_SECONDS });
  } catch (error) {
    console.error('[AgoraToken] Failed to mint token:', error);
    return res.status(500).json({ ok: false, error: 'Failed to mint token.' });
  }
});

// Export as a single function. Deploying this function yields a URL like:
// https://us-central1-<PROJECT>.cloudfunctions.net/agoraToken
exports.agoraToken = functions.https.onRequest(app);
