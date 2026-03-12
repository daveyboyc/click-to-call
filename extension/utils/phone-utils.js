import { findPhoneNumbersInText, parsePhoneNumberFromString } from 'libphonenumber-js/max';

export const DEFAULT_COUNTRY = 'GB';
export const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'TEXTAREA',
  'INPUT',
  'SELECT',
  'CODE',
  'PRE',
  'A',
  'BUTTON',
  'NOSCRIPT',
  'SVG',
  'MATH'
]);

const SKIP_SELECTOR = Array.from(SKIP_TAGS).join(',');
const PHONE_TEXT_PATTERN = /(?:\+\d[\d\s().-]{6,}|(?:(?:\(0\))?(?:0\d|\d))[\d\s().-]{6,}\d)/g;

export function cleanCandidate(raw = '') {
  return raw.replace(/[\u00A0\u2007\u202F]/g, ' ').trim();
}

export function normaliseNumber(raw, defaultCountry = DEFAULT_COUNTRY) {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  const candidate = cleanCandidate(raw);

  try {
    const parsed = parsePhoneNumberFromString(candidate, defaultCountry);
    if (parsed?.isValid()) {
      return parsed.number;
    }
  } catch {
    // fall through
  }

  const cleaned = candidate.replace(/(?!^)\+/g, '').replace(/[^\d+]/g, '').replace(/^00/, '+');
  return /^\+\d{7,15}$/.test(cleaned) ? cleaned : null;
}

export function extractPhoneMatches(text, defaultCountry = DEFAULT_COUNTRY) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const matches = [];
  const seen = new Set();

  for (const result of findPhoneNumbersInText(text, defaultCountry)) {
    const number = result.number?.number || normaliseNumber(result.rawString, defaultCountry);
    if (!number) {
      continue;
    }

    const key = `${result.startsAt}:${number}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    matches.push({
      startsAt: result.startsAt,
      endsAt: result.endsAt,
      raw: result.rawString,
      number
    });
  }

  if (matches.length > 0) {
    return matches;
  }

  for (const match of text.matchAll(PHONE_TEXT_PATTERN)) {
    const raw = match[0];
    const number = normaliseNumber(raw, defaultCountry);
    if (!number) {
      continue;
    }

    const startsAt = match.index ?? 0;
    const key = `${startsAt}:${number}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    matches.push({
      startsAt,
      endsAt: startsAt + raw.length,
      raw,
      number
    });
  }

  return matches;
}

export function shouldSkipNode(node) {
  if (!node) {
    return true;
  }

  const parent = node.parentElement;
  if (!parent) {
    return true;
  }

  return SKIP_TAGS.has(parent.tagName) || parent.closest(SKIP_SELECTOR) !== null;
}
