const test = require('node:test');
const assert = require('node:assert/strict');

const {
  relayHandler,
  resetRateLimitStore,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
} = require('../index');
const { isValidE164, E164_REGEX } = require('../validators');

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };
}

test.beforeEach(() => {
  resetRateLimitStore();
});

test('E.164 validator uses the required regex', () => {
  assert.equal(String(E164_REGEX), '/^\\+[1-9]\\d{6,14}$/');
  assert.equal(isValidE164('+442079460958'), true);
  assert.equal(isValidE164('+34612345678'), true);
  assert.equal(isValidE164('442079460958'), false);
  assert.equal(isValidE164('+01234567'), false);
  assert.equal(isValidE164('+44 20 7946 0958'), false);
});

test('relay accepts valid request and sends FCM data message with + preserved', async () => {
  const sentMessages = [];
  const req = {
    method: 'POST',
    body: {
      number: '+442079460958',
      deviceToken: 'device-token-123',
    },
  };
  const res = createResponse();

  await relayHandler(req, res, {
    messaging: {
      send: async (message) => {
        sentMessages.push(message);
        return 'mock-message-id';
      },
    },
  });

  assert.equal(res.statusCode, 202);
  assert.equal(res.body.ok, true);
  assert.equal(sentMessages.length, 1);
  assert.deepEqual(sentMessages[0], {
    token: 'device-token-123',
    data: {
      number: '+442079460958',
    },
  });
  assert.ok(!('notification' in sentMessages[0]));
});

test('JSON round-trip preserves leading + in number payload', () => {
  const original = { number: '+35312345678', deviceToken: 'abc123' };
  const json = JSON.stringify(original);
  const parsed = JSON.parse(json);

  assert.equal(parsed.number, '+35312345678');
  assert.ok(json.includes('+35312345678'));
  assert.ok(!json.includes('%2B'));
  assert.ok(!json.includes('\\u002b'));
});

test('relay rejects invalid number with 400', async () => {
  const req = {
    method: 'POST',
    body: {
      number: '02079460958',
      deviceToken: 'device-token-123',
    },
  };
  const res = createResponse();

  await relayHandler(req, res, {
    messaging: { send: async () => 'should-not-send' },
  });

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'invalid-number' });
});

test('relay returns 410 for expired or invalid registration token', async () => {
  const req = {
    method: 'POST',
    body: {
      number: '+442079460958',
      deviceToken: 'expired-token',
    },
  };
  const res = createResponse();

  await relayHandler(req, res, {
    messaging: {
      send: async () => {
        const error = new Error('registration token not registered');
        error.code = 'messaging/registration-token-not-registered';
        throw error;
      },
    },
  });

  assert.equal(res.statusCode, 410);
  assert.deepEqual(res.body, { error: 'expired-device-token' });
});

test('relay rate-limits after 60 requests per minute per device token', async () => {
  let now = 1_700_000_000_000;
  const req = {
    method: 'POST',
    body: {
      number: '+442079460958',
      deviceToken: 'device-token-123',
    },
  };

  for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i += 1) {
    const res = createResponse();
    await relayHandler(req, res, {
      now: () => now,
      messaging: { send: async () => `message-${i}` },
    });
    assert.equal(res.statusCode, 202);
  }

  const limited = createResponse();
  await relayHandler(req, limited, {
    now: () => now,
    messaging: { send: async () => 'message-over-limit' },
  });

  assert.equal(limited.statusCode, 429);
  assert.deepEqual(limited.body, { error: 'rate-limit-exceeded' });
  assert.ok(Number(limited.headers['Retry-After']) >= 1);

  now += RATE_LIMIT_WINDOW_MS + 1;
  const afterWindow = createResponse();
  await relayHandler(req, afterWindow, {
    now: () => now,
    messaging: { send: async () => 'message-after-window' },
  });
  assert.equal(afterWindow.statusCode, 202);
});

test('relay responds to CORS preflight for v1', async () => {
  const req = { method: 'OPTIONS', body: undefined };
  const res = createResponse();

  await relayHandler(req, res, {});

  assert.equal(res.statusCode, 204);
  assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
  assert.equal(res.headers['Access-Control-Allow-Methods'], 'POST, OPTIONS');
});

test('relay returns 502 for generic upstream failures', async () => {
  const req = {
    method: 'POST',
    body: {
      number: '+442079460958',
      deviceToken: 'device-token-123',
    },
  };
  const res = createResponse();

  await relayHandler(req, res, {
    messaging: {
      send: async () => {
        throw new Error('upstream exploded');
      },
    },
  });

  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.body, { error: 'relay-failed' });
});
