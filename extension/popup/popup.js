import QRCode from 'qrcode';

const STORAGE_KEYS = {
  relayUrl: 'relayUrl',
  deviceToken: 'deviceToken',
  defaultCountry: 'defaultCountry',
  enabled: 'enabled',
  history: 'history'
};

const form = document.getElementById('settings-form');
const relayUrlInput = document.getElementById('relay-url');
const deviceTokenInput = document.getElementById('device-token');
const defaultCountryInput = document.getElementById('default-country');
const enabledInput = document.getElementById('enabled');
const statusNode = document.getElementById('status');
const historyNode = document.getElementById('history');
const qrCanvas = document.getElementById('qr-canvas');
const qrSection = document.getElementById('qr-section');
const generateQrButton = document.getElementById('generate-qr');

function renderHistory(history = []) {
  historyNode.replaceChildren();

  if (history.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'No numbers sent yet.';
    historyNode.appendChild(item);
    return;
  }

  for (const entry of history) {
    const item = document.createElement('li');
    const time = entry.sentAt ? new Date(entry.sentAt).toLocaleString() : 'Unknown time';
    item.textContent = `${entry.number} — ${time}`;
    historyNode.appendChild(item);
  }
}

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.style.color = isError ? '#b91c1c' : '#166534';
}

async function generateQr() {
  const relayUrl = relayUrlInput.value.trim();
  const deviceToken = deviceTokenInput.value.trim();

  if (!relayUrl) {
    setStatus('Enter a relay URL before generating a QR code.', true);
    return;
  }

  const payload = { url: relayUrl };
  if (deviceToken) {
    payload.token = deviceToken;
  }

  try {
    await QRCode.toCanvas(qrCanvas, JSON.stringify(payload), {
      width: 200,
      margin: 2,
      color: { dark: '#1f2937', light: '#f6f8fb' }
    });
    qrCanvas.style.display = 'block';
    generateQrButton.textContent = 'Refresh QR Code';
  } catch (err) {
    setStatus('Failed to generate QR code.', true);
  }
}

async function loadSettings() {
  const stored = await chrome.storage.sync.get({
    [STORAGE_KEYS.relayUrl]: '',
    [STORAGE_KEYS.deviceToken]: '',
    [STORAGE_KEYS.defaultCountry]: '',
    [STORAGE_KEYS.enabled]: true,
    [STORAGE_KEYS.history]: []
  });

  relayUrlInput.value = stored[STORAGE_KEYS.relayUrl];
  deviceTokenInput.value = stored[STORAGE_KEYS.deviceToken];
  defaultCountryInput.value = stored[STORAGE_KEYS.defaultCountry];
  enabledInput.checked = stored[STORAGE_KEYS.enabled];
  renderHistory(stored[STORAGE_KEYS.history]);

  // Auto-show QR if relay URL is already configured
  if (stored[STORAGE_KEYS.relayUrl]) {
    generateQr();
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  await chrome.storage.sync.set({
    [STORAGE_KEYS.relayUrl]: relayUrlInput.value.trim(),
    [STORAGE_KEYS.deviceToken]: deviceTokenInput.value.trim(),
    [STORAGE_KEYS.defaultCountry]: defaultCountryInput.value.trim().toUpperCase(),
    [STORAGE_KEYS.enabled]: enabledInput.checked
  });

  setStatus('Settings saved.');
  generateQr();
});

generateQrButton.addEventListener('click', generateQr);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') {
    return;
  }

  if (changes[STORAGE_KEYS.history]) {
    renderHistory(changes[STORAGE_KEYS.history].newValue || []);
  }
});

loadSettings().catch((error) => setStatus(error.message, true));
