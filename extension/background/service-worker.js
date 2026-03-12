const RELAY_URL = 'https://us-central1-click-to-call-76c61.cloudfunctions.net/relay';

const STORAGE_KEYS = {
  relayUrl: 'relayUrl',
  deviceToken: 'deviceToken',
  enabled: 'enabled',
  history: 'history'
};

async function getSettings() {
  const stored = await chrome.storage.sync.get({
    [STORAGE_KEYS.relayUrl]: RELAY_URL,
    [STORAGE_KEYS.deviceToken]: '',
    [STORAGE_KEYS.enabled]: true,
    [STORAGE_KEYS.history]: []
  });

  return {
    relayUrl: stored[STORAGE_KEYS.relayUrl],
    deviceToken: stored[STORAGE_KEYS.deviceToken],
    enabled: stored[STORAGE_KEYS.enabled],
    history: stored[STORAGE_KEYS.history]
  };
}

async function appendHistory(entry) {
  const { history } = await getSettings();
  const updated = [entry, ...history].slice(0, 10);
  await chrome.storage.sync.set({ [STORAGE_KEYS.history]: updated });
}

async function sendNumber(number) {
  const { relayUrl, deviceToken, enabled } = await getSettings();

  if (!enabled) {
    throw new Error('Click-to-call is disabled');
  }
  if (!relayUrl) {
    throw new Error('Relay URL not configured');
  }
  if (!deviceToken) {
    throw new Error('Device token not configured');
  }

  const response = await fetch(relayUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      number,
      deviceToken
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Relay request failed: ${response.status}`);
  }

  const entry = {
    number,
    sentAt: new Date().toISOString()
  };
  await appendHistory(entry);
  return entry;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'CLICK_TO_CALL_SEND' || !message.number) {
    return false;
  }

  sendNumber(message.number)
    .then((entry) => sendResponse({ ok: true, entry }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});
