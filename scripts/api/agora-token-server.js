import express from 'express';
import cors from 'cors';
import agoraAccessToken from 'agora-access-token';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { RtcRole, RtcTokenBuilder } = agoraAccessToken;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function stripWrappingQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.length < 2) return trimmed;
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if ((first === '"' && last === '"') || (first === '\'' && last === '\'')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const source = fs.readFileSync(filePath, 'utf8');
  const lines = source.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const noExport = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
    const eqIndex = noExport.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = noExport.slice(0, eqIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (Object.prototype.hasOwnProperty.call(process.env, key)) continue;

    const rawValue = noExport.slice(eqIndex + 1);
    process.env[key] = stripWrappingQuotes(rawValue);
  }
}

const repoRoot = path.resolve(__dirname, '../..');
loadEnvFile(path.join(repoRoot, '.env'));
loadEnvFile(path.join(repoRoot, '.env.local'));

const app = express();

const PORT = Number(process.env.PORT || 3010);
const AGORA_APP_ID = process.env.AGORA_APP_ID || 'c629354328614f25b6448169ab3ed43b';
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';
const AGORA_TOKEN_TTL_SECONDS = Number(process.env.AGORA_TOKEN_TTL_SECONDS || 3600);
const AGORA_TOKEN_SHARED_SECRET = process.env.AGORA_TOKEN_SHARED_SECRET || '';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const HOST = process.env.HOST || '0.0.0.0';
const CORS_DEBUG = ['1', 'true', 'yes', 'on'].includes(String(process.env.CORS_DEBUG || '').toLowerCase());

const configuredOrigins = CORS_ORIGIN === '*'
  ? ['*']
  : CORS_ORIGIN.split(',').map(v => v.trim()).filter(Boolean);

function parseOriginHost(value) {
  if (!value || typeof value !== 'string') return '';

  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return value
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .trim()
      .toLowerCase();
  }
}

function isAppGithubDevHost(host) {
  return host === 'app.github.dev' || host.endsWith('.app.github.dev');
}

function debugCorsLog(message, details) {
  if (!CORS_DEBUG) return;
  if (details) {
    console.log(`[AgoraToken][CORS] ${message}`, details);
    return;
  }
  console.log(`[AgoraToken][CORS] ${message}`);
}

function isOriginAllowed(origin) {
  if (!origin) return { allowed: true, reason: 'no-origin-header' };
  if (configuredOrigins.includes('*')) return { allowed: true, reason: 'wildcard-config' };
  if (!configuredOrigins.length) return { allowed: true, reason: 'empty-config' };

  const normalizedOrigin = String(origin).trim().toLowerCase();
  const configuredNormalized = configuredOrigins.map((entry) => String(entry).trim().toLowerCase());

  if (configuredNormalized.includes(normalizedOrigin)) {
    return { allowed: true, reason: 'direct-origin-match' };
  }

  const originHost = parseOriginHost(origin);
  if (!originHost) return { allowed: false, reason: 'invalid-origin-host' };

  const directHostMatch = configuredNormalized.some((entry) => parseOriginHost(entry) === originHost);
  if (directHostMatch) {
    return { allowed: true, reason: 'direct-host-match' };
  }

  const allowGithubDev = configuredNormalized.includes('https://*.app.github.dev')
    || configuredNormalized.includes('*.app.github.dev')
    || configuredNormalized.includes('app.github.dev')
    || configuredNormalized.some((entry) => isAppGithubDevHost(parseOriginHost(entry)));

  if (allowGithubDev && isAppGithubDevHost(originHost)) {
    return { allowed: true, reason: 'github-dev-host-match' };
  }

  return { allowed: false, reason: 'no-match' };
}

const corsOptions = {
  origin: (origin, callback) => {
    const decision = isOriginAllowed(origin);
    debugCorsLog('origin-check', {
      origin: origin || null,
      allowed: decision.allowed,
      reason: decision.reason,
      configuredOrigins,
    });

    if (decision.allowed) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-wigcord-token-secret'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  if (!CORS_DEBUG || req.method !== 'OPTIONS') return next();

  debugCorsLog('preflight-request', {
    path: req.path,
    origin: req.headers.origin || null,
    requestedMethod: req.headers['access-control-request-method'] || null,
    requestedHeaders: req.headers['access-control-request-headers'] || null,
  });
  next();
});

const MIN_ID_LEN = 2;
const MAX_ID_LEN = 64;
const ID_PATTERN = /^[A-Za-z0-9_\-]+$/;

const rateWindowMs = 30 * 1000;
const rateLimitMax = 25;
const rateState = new Map();

function isValidIdentifier(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= MIN_ID_LEN && trimmed.length <= MAX_ID_LEN && ID_PATTERN.test(trimmed);
}

function withRateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = rateState.get(ip) || [];
  const recent = current.filter(ts => now - ts < rateWindowMs);

  if (recent.length >= rateLimitMax) {
    return res.status(429).json({ ok: false, error: 'Too many token requests. Try again shortly.' });
  }

  recent.push(now);
  rateState.set(ip, recent);
  next();
}

function authorizeRequest(req) {
  if (!AGORA_TOKEN_SHARED_SECRET) return true;
  const headerSecret = req.headers['x-wigcord-token-secret'];
  return typeof headerSecret === 'string' && headerSecret === AGORA_TOKEN_SHARED_SECRET;
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'agora-token-server',
    appIdConfigured: !!AGORA_APP_ID,
    certificateConfigured: !!AGORA_APP_CERTIFICATE,
  });
});

app.post('/agora/token', withRateLimit, (req, res) => {
  if (!authorizeRequest(req)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized token request.' });
  }

  if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    return res.status(500).json({ ok: false, error: 'Agora token server not configured.' });
  }

  const { uid, channelName } = req.body || {};

  if (!isValidIdentifier(uid)) {
    return res.status(400).json({ ok: false, error: 'Invalid uid.' });
  }

  if (!isValidIdentifier(channelName)) {
    return res.status(400).json({ ok: false, error: 'Invalid channelName.' });
  }

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

    return res.json({
      ok: true,
      appId: AGORA_APP_ID,
      channelName,
      uid,
      token,
      expiresAt: privilegeExpireTs,
      ttlSeconds: AGORA_TOKEN_TTL_SECONDS,
    });
  } catch (error) {
    console.error('[AgoraToken] Failed to mint token:', error);
    return res.status(500).json({ ok: false, error: 'Failed to mint token.' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`[AgoraToken] Listening on ${HOST}:${PORT}`);
});
