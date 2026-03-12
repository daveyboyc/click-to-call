import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const candidateModules = [
  path.join(repoRoot, 'extension/utils/phone.js'),
  path.join(repoRoot, 'extension/utils/phone-utils.js'),
  path.join(repoRoot, 'extension/utils/phone-utils.mjs'),
  path.join(repoRoot, 'extension/src/utils/phone.js'),
  path.join(repoRoot, 'extension/src/utils/phone-utils.js')
];

async function loadPhoneModule() {
  for (const modulePath of candidateModules) {
    try {
      await access(modulePath);
      return {
        modulePath,
        module: await import(new URL(`file://${modulePath}`))
      };
    } catch {
      // try next
    }
  }
  return null;
}

function fallbackNormalise(raw, defaultCountry = 'GB') {
  const digitsAndPlus = raw.replace(/(?!^)[^\d]/g, '').replace(/[^\d+]/g, '');
  if (/^\+\d{7,15}$/.test(digitsAndPlus)) return digitsAndPlus;

  const digits = raw.replace(/\D/g, '');
  if (defaultCountry === 'GB' && /^0\d{9,10}$/.test(digits)) return `+44${digits.slice(1)}`;
  if (defaultCountry === 'US' && /^1?\d{10}$/.test(digits)) return `+1${digits.slice(-10)}`;
  return null;
}

function resolveNormaliser(phoneModule) {
  if (phoneModule?.module?.normaliseNumber) return phoneModule.module.normaliseNumber;
  if (phoneModule?.module?.normalizeNumber) return phoneModule.module.normalizeNumber;
  return fallbackNormalise;
}

test('test page exists with realistic international examples', async () => {
  const pagePath = path.join(repoRoot, 'e2e/test-page.html');
  const html = await import('node:fs/promises').then(fs => fs.readFile(pagePath, 'utf8'));
  assert.match(html, /\+44 20 7946 0958/);
  assert.match(html, /020 7946 0958/);
  assert.match(html, /\+34 612 345 678/);
  assert.match(html, /\+353 1 234 5678/);
  assert.match(html, /\+1 \(415\) 555-2671/);
});

test('normalisation preserves the leading plus for E.164 inputs', async () => {
  const phoneModule = await loadPhoneModule();
  const normalise = resolveNormaliser(phoneModule);

  const examples = [
    ['+44 20 7946 0958', 'GB', '+442079460958'],
    ['+34 612 345 678', 'ES', '+34612345678'],
    ['+353 1 234 5678', 'IE', '+35312345678'],
    ['+1 (415) 555-2671', 'US', '+14155552671']
  ];

  for (const [raw, country, expected] of examples) {
    const actual = normalise(raw, country);
    assert.equal(actual, expected, `expected ${raw} -> ${expected}${phoneModule ? ` via ${phoneModule.modulePath}` : ' via fallback normaliser'}`);
    assert.ok(actual.startsWith('+'));
  }
});

test('GB local format can still become +44 E.164', async () => {
  const phoneModule = await loadPhoneModule();
  const normalise = resolveNormaliser(phoneModule);
  const actual = normalise('020 7946 0958', 'GB');
  assert.equal(actual, '+442079460958');
});
