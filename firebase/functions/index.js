const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const { isValidE164, isNonEmptyString } = require('./validators');

if (!admin.apps.length) {
  admin.initializeApp();
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const FCM_ANDROID_TTL_MS = 30 * 1000;
const rateLimitStore = new Map();

function setCorsHeaders(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

function checkRateLimit(deviceToken, now = Date.now()) {
  const bucket = rateLimitStore.get(deviceToken);

  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(deviceToken, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - bucket.windowStart)) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - bucket.count };
}

function resetRateLimitStore() {
  rateLimitStore.clear();
}

async function relayHandler(req, res, deps = {}) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method-not-allowed' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { number, deviceToken } = body;

  if (!isNonEmptyString(deviceToken)) {
    return res.status(400).json({ error: 'invalid-device-token' });
  }

  if (!isValidE164(number)) {
    return res.status(400).json({ error: 'invalid-number' });
  }

  const rateLimit = checkRateLimit(deviceToken, deps.now ? deps.now() : Date.now());
  if (!rateLimit.allowed) {
    res.set('Retry-After', String(rateLimit.retryAfterSeconds));
    return res.status(429).json({ error: 'rate-limit-exceeded' });
  }

  const message = {
    token: deviceToken,
    data: {
      number,
    },
    android: {
      priority: 'high',
      ttl: FCM_ANDROID_TTL_MS,
    },
  };

  try {
    const messaging = deps.messaging || admin.messaging();
    const messageId = await messaging.send(message);
    return res.status(202).json({ ok: true, messageId });
  } catch (error) {
    logger.error('Failed to relay click-to-call message', {
      code: error && error.code,
      message: error && error.message,
    });

    if (error && (error.code === 'messaging/registration-token-not-registered' || error.code === 'messaging/invalid-registration-token')) {
      return res.status(410).json({ error: 'expired-device-token' });
    }

    return res.status(502).json({ error: 'relay-failed' });
  }
}

const relay = onRequest({ cors: true }, relayHandler);

module.exports = {
  relay,
  relayHandler,
  checkRateLimit,
  resetRateLimitStore,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  FCM_ANDROID_TTL_MS,
};
