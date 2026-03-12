import test from 'node:test';
import assert from 'node:assert/strict';

function normalizeForPipeline(raw, defaultCountry = 'GB') {
  const compact = raw.replace(/[^\d+]/g, '');
  if (/^\+\d{7,15}$/.test(compact)) return compact;

  const digits = raw.replace(/\D/g, '');
  if (defaultCountry === 'GB' && /^0\d{9,10}$/.test(digits)) return `+44${digits.slice(1)}`;
  if (defaultCountry === 'US' && /^1?\d{10}$/.test(digits)) return `+1${digits.slice(-10)}`;
  return null;
}

function buildRelayRequest(number, deviceToken = 'demo-device-token') {
  return JSON.stringify({ number, deviceToken });
}

function relayToFcm(requestJson) {
  const parsed = JSON.parse(requestJson);
  return {
    token: parsed.deviceToken,
    data: {
      number: parsed.number,
      action: 'dial'
    }
  };
}

function androidDialUri(fcmMessage) {
  return `tel:${fcmMessage.data.number}`;
}

test('the plus sign survives every conceptual pipeline hop', () => {
  const raw = '+44 20 7946 0958';
  const normalized = normalizeForPipeline(raw, 'GB');
  assert.equal(normalized, '+442079460958');

  const relayRequest = buildRelayRequest(normalized);
  assert.match(relayRequest, /"number":"\+442079460958"/);

  const fcmMessage = relayToFcm(relayRequest);
  assert.equal(fcmMessage.data.number, '+442079460958');

  const dialUri = androidDialUri(fcmMessage);
  assert.equal(dialUri, 'tel:+442079460958');
});

test('JSON encoding does not strip the plus sign', () => {
  const payload = { number: '+34612345678', deviceToken: 'abc123' };
  const json = JSON.stringify(payload);
  const roundTrip = JSON.parse(json);

  assert.equal(roundTrip.number, '+34612345678');
  assert.ok(json.includes('+34612345678'));
});

test('local-format input can become plus-prefixed output before relay', () => {
  const normalized = normalizeForPipeline('020 7946 0958', 'GB');
  assert.equal(normalized, '+442079460958');

  const fcmMessage = relayToFcm(buildRelayRequest(normalized));
  assert.equal(fcmMessage.data.number[0], '+');
  assert.equal(androidDialUri(fcmMessage), 'tel:+442079460958');
});
