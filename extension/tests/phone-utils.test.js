import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_COUNTRY,
  SKIP_TAGS,
  extractPhoneMatches,
  normaliseNumber,
  shouldSkipNode
} from '../utils/phone-utils.js';

test('uses GB as the default country', () => {
  assert.equal(DEFAULT_COUNTRY, 'GB');
});

test('normaliseNumber preserves leading plus for E.164 numbers', () => {
  assert.equal(normaliseNumber('+44 20 7946 0958'), '+442079460958');
  assert.equal(normaliseNumber('+34 612 345 678'), '+34612345678');
  assert.equal(normaliseNumber('+353 1 234 5678'), '+35312345678');
});

test('normaliseNumber converts national GB numbers to E.164', () => {
  assert.equal(normaliseNumber('020 7946 0958'), '+442079460958');
});

test('normaliseNumber drops internal pluses and preserves only a leading plus', () => {
  assert.equal(normaliseNumber('+44+20 7946 0958'), '+442079460958');
  assert.equal(normaliseNumber('+1 (415)+555-2671'), '+14155552671');
});

test('normaliseNumber converts 00-prefixed numbers into E.164 output', () => {
  assert.equal(normaliseNumber('0044 20 7946 0958'), '+442079460958');
  assert.equal(normaliseNumber('00353 1 234 5678'), '+35312345678');
});

test('normaliseNumber rejects garbage and incomplete inputs', () => {
  assert.equal(normaliseNumber('call me maybe'), null);
  assert.equal(normaliseNumber('12345'), null);
});

test('extractPhoneMatches returns detected numbers with E.164 output', () => {
  const matches = extractPhoneMatches('Sales: +44 20 7946 0958, Madrid: +34 612 345 678');

  assert.deepEqual(
    matches.map((match) => match.number),
    ['+442079460958', '+34612345678']
  );
});

test('extractPhoneMatches falls back to regex matching when libphonenumber does not return matches', () => {
  const matches = extractPhoneMatches('Broken formatting: +44+20 7946 0958 and 0044 20 7946 0958');

  assert.deepEqual(
    matches.map((match) => match.number),
    ['+442079460958', '+442079460958']
  );
});

test('skip list includes all required tag names', () => {
  for (const tag of ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'CODE', 'PRE', 'A', 'BUTTON', 'NOSCRIPT', 'SVG', 'MATH']) {
    assert.equal(SKIP_TAGS.has(tag), true);
  }
});

test('shouldSkipNode checks parent and ancestor tags', () => {
  const blockedParent = {
    tagName: 'CODE',
    closest: () => null
  };
  assert.equal(shouldSkipNode({ parentElement: blockedParent }), true);

  const nested = {
    tagName: 'SPAN',
    closest: (selector) => (selector.includes('A') ? {} : null)
  };
  assert.equal(shouldSkipNode({ parentElement: nested }), true);

  const allowed = {
    tagName: 'SPAN',
    closest: () => null
  };
  assert.equal(shouldSkipNode({ parentElement: allowed }), false);
});
