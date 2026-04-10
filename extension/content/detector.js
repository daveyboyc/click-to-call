import { DEFAULT_COUNTRY, extractPhoneMatches, shouldSkipNode } from '../utils/phone-utils.js';

const LINK_CLASS = 'click-to-call-link';
const WRAPPER_ATTR = 'data-click-to-call-processed';

let activeCountry = DEFAULT_COUNTRY;

// Load user's default country from storage
chrome.storage.sync.get({ defaultCountry: DEFAULT_COUNTRY }, (result) => {
  if (result.defaultCountry) {
    activeCountry = result.defaultCountry;
  }
});

// Update if the setting changes while the page is open
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.defaultCountry) {
    activeCountry = changes.defaultCountry.newValue || DEFAULT_COUNTRY;
  }
});

function createLink(number, label) {
  const link = document.createElement('button');
  link.type = 'button';
  link.className = LINK_CLASS;
  link.textContent = label;
  link.dataset.number = number;
  link.setAttribute('aria-label', `Call ${label}`);
  link.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await chrome.runtime.sendMessage({
        type: 'CLICK_TO_CALL_SEND',
        number
      });
    } catch (_error) {
      // Relay failure is visible in the popup history (missing entry)
    }
  });

  return link;
}

function replaceTextNode(textNode) {
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE || shouldSkipNode(textNode)) {
    return;
  }

  const text = textNode.textContent;
  if (!text || !text.trim()) {
    return;
  }

  const matches = extractPhoneMatches(text, activeCountry);
  if (matches.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();
  let cursor = 0;

  for (const match of matches) {
    if (match.startsAt > cursor) {
      fragment.appendChild(document.createTextNode(text.slice(cursor, match.startsAt)));
    }

    fragment.appendChild(createLink(match.number, text.slice(match.startsAt, match.endsAt)));
    cursor = match.endsAt;
  }

  if (cursor < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(cursor)));
  }

  const wrapper = document.createElement('span');
  wrapper.setAttribute(WRAPPER_ATTR, 'true');
  wrapper.appendChild(fragment);
  textNode.parentNode?.replaceChild(wrapper, textNode);
}

function scanNode(root) {
  if (!root) {
    return;
  }

  if (root.nodeType === Node.TEXT_NODE) {
    replaceTextNode(root);
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const element = root;
  if (element.closest(`[${WRAPPER_ATTR}]`)) {
    return;
  }

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (shouldSkipNode(node) || !node.textContent?.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const textNodes = [];
  let current;
  while ((current = walker.nextNode())) {
    textNodes.push(current);
  }

  for (const textNode of textNodes) {
    replaceTextNode(textNode);
  }
}

function startObserver() {
  if (!document.body) {
    return;
  }

  scanNode(document.body);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        scanNode(node);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserver, { once: true });
} else {
  startObserver();
}
