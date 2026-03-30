import agoraAccessToken from 'agora-access-token';

const { RtcRole, RtcTokenBuilder } = agoraAccessToken;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-wigcord-token-secret',
};

function isValidIdentifier(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 64) return false;
  return /^[A-Za-z0-9_\-]+$/.test(trimmed);
}

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, '');

    // health
    if (request.method === 'GET' && (pathname === '/health' || pathname === '/')) {
      return new Response(JSON.stringify({ status: 'ok', service: 'agora-token-worker', appIdConfigured: !!env.AGORA_APP_ID, certificateConfigured: !!env.AGORA_APP_CERTIFICATE }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST' && pathname === '/agora/token') {
      try {
        const headerSecret = request.headers.get('x-wigcord-token-secret');
        const sharedSecret = env.AGORA_TOKEN_SHARED_SECRET || '';
        if (sharedSecret && headerSecret !== sharedSecret) {
          return new Response(JSON.stringify({ ok: false, error: 'Unauthorized token request.' }), { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
        }

        if (!env.AGORA_APP_ID || !env.AGORA_APP_CERTIFICATE) {
          return new Response(JSON.stringify({ ok: false, error: 'Agora token server not configured.' }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
        }

        const body = await request.json().catch(() => ({}));
        const uid = body.uid;
        const channelName = body.channelName;

        if (!isValidIdentifier(uid)) return new Response(JSON.stringify({ ok: false, error: 'Invalid uid.' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
        if (!isValidIdentifier(channelName)) return new Response(JSON.stringify({ ok: false, error: 'Invalid channelName.' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

        const now = Math.floor(Date.now() / 1000);
        const ttl = Number(env.AGORA_TOKEN_TTL_SECONDS || 3600);
        const privilegeExpireTs = now + ttl;

        // Build token using agora-access-token (bundled by wrangler/esbuild)
        const token = RtcTokenBuilder.buildTokenWithAccount(
          env.AGORA_APP_ID,
          env.AGORA_APP_CERTIFICATE,
          channelName,
          uid,
          RtcRole.PUBLISHER,
          privilegeExpireTs,
          privilegeExpireTs
        );

        return new Response(JSON.stringify({ ok: true, appId: env.AGORA_APP_ID, channelName, uid, token, expiresAt: privilegeExpireTs, ttlSeconds: ttl }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      } catch (error) {
        console.error('[AgoraWorker] token error:', error);
        return new Response(JSON.stringify({ ok: false, error: error?.message || 'Failed to mint token.' }), { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
      }
    }

    return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
  }
};
