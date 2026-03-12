const STORAGE_KEYS = {
  relayUrl: 'relayUrl',
  deviceToken: 'deviceToken',
  enabled: 'enabled',
  history: 'history'
};

const form = document.getElementById('settings-form');
const relayUrlInput = document.getElementById('relay-url');
const deviceTokenInput = document.getElementById('device-token');
const enabledInput = document.getElementById('enabled');
const statusNode = document.getElementById('status');
const historyNode = document.getElementById('history');

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

async function loadSettings() {
  const stored = await chrome.storage.sync.get({
    [STORAGE_KEYS.relayUrl]: '',
    [STORAGE_KEYS.deviceToken]: '',
    [STORAGE_KEYS.enabled]: true,
    [STORAGE_KEYS.history]: []
  });

  relayUrlInput.value = stored[STORAGE_KEYS.relayUrl];
  deviceTokenInput.value = stored[STORAGE_KEYS.deviceToken];
  enabledInput.checked = stored[STORAGE_KEYS.enabled];
  renderHistory(stored[STORAGE_KEYS.history]);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  await chrome.storage.sync.set({
    [STORAGE_KEYS.relayUrl]: relayUrlInput.value.trim(),
    [STORAGE_KEYS.deviceToken]: deviceTokenInput.value.trim(),
    [STORAGE_KEYS.enabled]: enabledInput.checked
  });

  setStatus('Settings saved.');
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
