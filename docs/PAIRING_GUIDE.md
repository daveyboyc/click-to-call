# Pairing Guide

This guide covers the expected pairing flow between the Chrome extension and the Android device.

## Goal

Store enough information in the extension so a detected browser phone number can be relayed to the correct Android device without losing E.164 formatting.

Minimum pairing data:
- relay URL
- Android device token (typically the FCM registration token, or an app-generated pairing token that resolves to it)
- optional default country for local-number normalization

## Before you start

Have these ready:
- the deployed Firebase relay URL
- an installed Android build of the click-to-call app
- Chrome with the unpacked extension loaded
- the `e2e/test-page.html` page available for a safe test

## Recommended pairing flow

### 1. Install and open the Android app
The app should do two things on first launch:
- request notification permission if needed
- fetch or display the device token / pairing token

Recommended UI copy in the app:
- **Device token**: raw FCM token used by the relay
- **Pairing token**: friendlier wrapper if you later add backend lookup

## 2. Copy the pairing value from Android
Capture one of:
- the exact FCM device token, or
- a backend-issued pairing token that maps to the device token

If you are using direct FCM routing in the first version, the extension will likely store the raw device token.

## 3. Open the extension popup in Chrome
The popup should expose at least these fields:
- **Relay URL**
- **Device token / Pairing token**
- **Default country** (for inputs like `020 7946 0958`)
- **Enabled** toggle

## 4. Save settings
Expected stored values:

```json
{
  "relayUrl": "https://REGION-PROJECT.cloudfunctions.net/relayCall",
  "deviceToken": "fcm-device-token",
  "defaultCountry": "GB",
  "enabled": true
}
```

## 5. Test with an international number
Open `e2e/test-page.html` and trigger a send using:
- `+44 20 7946 0958`
- `+34 612 345 678`
- `+353 1 234 5678`

Success criteria:
- extension normalizes to `+...`
- relay receives `"number": "+..."`
- Android notification carries the same exact value
- dialer opens as `tel:+...`

## 6. Test with a local-format number
Use `020 7946 0958` with default country `GB`.

Success criteria:
- extension converts it to `+442079460958` before relay
- relay and Android only ever see the E.164 form

## Debugging the pairing path

### Checkpoint 1: extension storage
Inspect saved settings in extension storage and confirm:
- relay URL is correct
- token is non-empty
- default country is set as expected

### Checkpoint 2: network request
Inspect the outgoing request and verify the body looks like:

```json
{
  "number": "+442079460958",
  "deviceToken": "..."
}
```

If you see form data or a query string, that is a warning sign because `+` can be misinterpreted.

### Checkpoint 3: Firebase function logs
Log both the raw inbound request and the outbound FCM payload.

You want exact string matches like:
- inbound number: `+442079460958`
- outbound FCM number: `+442079460958`

### Checkpoint 4: Android logs
Log these values when handling the push:
- received FCM `number`
- notification payload number
- final `tel:` URI

Expected URI:

```text
tel:+442079460958
```

## Security notes

- Treat raw FCM device tokens as secrets enough to avoid exposing them casually in screenshots or logs shared publicly.
- Prefer authenticated relay requests before production rollout.
- Rate-limit relay calls to prevent spam or accidental loops.
- If you later add account-based pairing, keep the `number` field untouched while only changing how the device is resolved.

## Release gate

Do not consider pairing complete unless all of these are true:
- test page can trigger a send
- Android receives the push
- dialer opens
- the leading `+` is preserved end to end
