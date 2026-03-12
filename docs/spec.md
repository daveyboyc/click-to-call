# Click-to-Call Spec

Source: https://claude.ai/public/artifacts/c9a8ed50-f6bc-4a24-9c5e-29ee14b793e0
Fetched: 2026-03-11

> Note: This file contains the readable portion I could fetch from the public Claude artifact. The source fetch was truncated, so this may not be the complete artifact.

## Title

**Click-to-Call: Full-Stack Build Specification & Implementation Guide**

## Project Overview

A three-component system that detects phone numbers in the browser, relays them to an Android phone, and opens the native dialer.

Components:
- Chrome Extension (Manifest V3)
- Relay Server (Firebase Cloud Functions + FCM)
- Android App (Kotlin)

Key design constraint: The `+` sign and all international formats must survive the entire pipeline intact.

## Architecture

```text
[Chrome Extension]
 → HTTPS POST (number + device token)
 → [Firebase Cloud Function]
 → FCM push notification (number in data payload)
 → [Android App]
 → User taps notification
 → Intent.ACTION_DIAL with tel: URI
 → Native dialer opens with number
```

## Chrome Extension Highlights

- Scans page DOM for phone numbers and converts them to clickable links
- Sends number to a configured Firebase endpoint
- Popup UI for relay URL, device pairing token, toggle, and send history
- Uses `libphonenumber-js/max`
- Preserves E.164 formatting with `+`
- Uses TreeWalker and MutationObserver

## Core Number Handling

```javascript
import { findPhoneNumbersInText, parsePhoneNumber } from 'libphonenumber-js/max';

export function normaliseNumber(raw, defaultCountry = 'GB') {
  try {
    const parsed = parsePhoneNumber(raw, defaultCountry);
    if (parsed && parsed.isValid()) return parsed.format('E.164');
    const cleaned = raw.replace(/[^\\d+]/g, '');
    if (/^\\+\\d{7,15}$/.test(cleaned)) return cleaned;
    return null;
  } catch {
    return null;
  }
}
```

## Key Test Emphasis

Must preserve `+` across examples like:
- `+44 20 7946 0958` → `+442079460958`
- `020 7946 0958` with `GB` default → `+442079460958`
- `+34 612 345 678` → `+34612345678`
- `+353 1 234 5678` → `+35312345678`

## Firebase Relay (visible portion)

The fetched content begins this section and indicates:
- relay accepts `{ number, deviceToken }`
- validates E.164 format
- forwards via FCM data message

The remainder of the Firebase / Android sections was truncated in the fetched artifact.
