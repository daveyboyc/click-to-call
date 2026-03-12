import QRCode from 'qrcode';

const RELAY_URL = 'https://us-central1-click-to-call-76c61.cloudfunctions.net/relay';

const STORAGE_KEYS = {
  relayUrl: 'relayUrl',
  deviceToken: 'deviceToken',
  enabled: 'enabled',
  history: 'history'
};

const form = document.getElementById('settings-form');
const deviceTokenInput = document.getElementById('device-token');
const enabledInput = document.getElementById('enabled');
const statusNode = document.getElementById('status');
const historyNode = document.getElementById('history');
const qrSection = document.getElementById('qr-section');
const qrCanvas = document.getElementById('qr-code');

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

async function generateQR(token) {
  qrSection.hidden = !token || token.trim() === '';
  
  if (!token || token.trim() === '') {
    return;
  }

  // Encode config as JSON for the app to scan
  const config = { url: RELAY_URL, token: token.trim() };
  const qrData = JSON.stringify(config);

  await QRCode.toCanvas(qrCanvas, qrData, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
}

async function loadSettings() {
  const stored = await chrome.storage.sync.get({
    [STORAGE_KEYS.relayUrl]: RELAY_URL,
    [STORAGE_KEYS.deviceToken]: '',
    [STORAGE_KEYS.enabled]: true,
    [STORAGE_KEYS.history]: []
  });

  deviceTokenInput.value = stored[STORAGE_KEYS.deviceToken];
  enabledInput.checked = stored[STORAGE_KEYS.enabled];
  renderHistory(stored[STORAGE_KEYS.history]);

  // Generate QR if we have a token
  await generateQR(stored[STORAGE_KEYS.deviceToken]);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const token = deviceTokenInput.value.trim();

  await chrome.storage.sync.set({
    [STORAGE_KEYS.relayUrl]: RELAY_URL,
    [STORAGE_KEYS.deviceToken]: token,
    [STORAGE_KEYS.enabled]: enabledInput.checked
  });

  await generateQR(token);
  setStatus('Settings saved.');
});

deviceTokenInput.addEventListener('input', async () => {
  await generateQR(deviceTokenInput.value.trim());
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') {
    return;
  }

  if (changes[STORAGE_KEYS.history]) {
    renderHistory(changes[STORAGE_KEYS.history].newValue || []);
  }
});

loadSettings().catch((error) => setStatus(error.message, true));
