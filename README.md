# Click-to-Call

Chrome extension → Firebase relay → Android dialer app.

The system detects phone numbers in a web page, normalizes them to E.164, posts them to a Firebase Cloud Function, pushes them to a paired Android device with FCM, and opens the native dialer when the user taps the notification.

## Non-negotiable rule

The leading `+` must survive every hop.

Examples:
- `+44 20 7946 0958` → `+442079460958`
- `020 7946 0958` with `GB` default → `+442079460958`
- `+34 612 345 678` → `+34612345678`
- `+353 1 234 5678` → `+35312345678`

If Android receives a number without `+`, treat it as a bug in the pipeline.

## Repo layout

```text
click-to-call/
├── android/
├── docs/
│   ├── PAIRING_GUIDE.md
│   ├── orchestration-plan.md
│   └── spec.md
├── e2e/
│   ├── package.json
│   ├── pipeline-test.js
│   ├── smoke.test.js
│   └── test-page.html
├── extension/
├── firebase/
├── CODEX.md
└── README.md
```

## Prerequisites

### Common
- Git
- Node.js 18+ and npm
- A Firebase project with Cloud Messaging enabled
- An Android device running Android 8+ for end-to-end testing
- Chrome or Chromium for loading the extension unpacked

### Extension
- Chrome/Chromium with developer mode enabled
- A future extension build in `extension/`
- Recommended phone parsing library: `libphonenumber-js/max`

### Firebase relay
- Firebase CLI
- Logged in with an account that can deploy functions and manage Cloud Messaging
- `firebase/functions/` project configured for Node 18 runtime

### Android
- Android Studio Hedgehog or newer
- Android SDK 34
- JDK 17
- Google Play Services available on the test device or emulator if using FCM
- Copy `android/local.properties.example` to `android/local.properties` if your SDK path is not auto-detected

## Local development flow

1. Build the extension.
2. Deploy or emulate the Firebase relay.
3. Build/install the Android app.
4. Pair the extension with the device token and relay URL.
5. Open `e2e/test-page.html` in Chrome and click a number.
6. Confirm the number reaches Android as `tel:+...`.

## Extension setup

Expected extension responsibilities:
- scan page text for phone numbers
- normalize to E.164
- preserve `+`
- send `{ number, deviceToken }` to the relay
- provide popup settings for relay URL, pairing token/device token, and enable/disable state

Typical dev loop:

```bash
cd extension
npm install
npm test
npm run build
```

Then load the unpacked extension in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Choose **Load unpacked**
4. Select the built extension directory
5. Open `e2e/test-page.html`
6. Verify the extension detects the sample numbers, especially `+44 20 7946 0958`

## Firebase deploy

Expected relay contract:

```json
{
  "number": "+442079460958",
  "deviceToken": "fcm-device-token"
}
```

Expected relay behavior:
- validate E.164 input
- reject malformed numbers
- forward the exact number in the FCM data payload
- avoid mutating `+` into a space or stripping it entirely

Typical deploy steps:

```bash
cd firebase/functions
npm install
npm test
cd ..
firebase deploy --only functions
```

Suggested payload sent to FCM:

```json
{
  "data": {
    "action": "dial",
    "number": "+442079460958"
  }
}
```

## Android build

Expected Android responsibilities:
- receive the FCM data message
- read `number` exactly as sent
- show a notification for the pending call
- on tap, open the dialer via `Intent.ACTION_DIAL`
- use `Uri.parse("tel:+442079460958")`

Typical build/test loop:

```bash
cd android
cp local.properties.example local.properties  # adjust sdk.dir if needed
./gradlew test
./gradlew assembleDebug
./gradlew installDebug
```

Once installed, verify the app can:
- register for push messaging
- expose a device pairing token or FCM token for setup
- open the dialer with a `tel:+...` URI intact

## Pairing

See [docs/PAIRING_GUIDE.md](docs/PAIRING_GUIDE.md) for the full process.

High level:
1. Install and launch the Android app.
2. Copy the device token / pairing token it exposes.
3. Open the extension popup.
4. Paste the relay URL and device token.
5. Save settings.
6. Send a test number from `e2e/test-page.html`.
7. Confirm the Android notification and final dialer URI include `+`.

## E2E tests

The `e2e/` folder is intentionally lightweight so it can run before the full implementation exists.

### Run

```bash
cd e2e
npm test
```

### What these tests do

- verify the test page contains realistic numbers
- verify `+` survives a conceptual extension → relay → FCM → Android pipeline
- attempt to import extension phone utilities if they exist
- otherwise fall back to a local normalizer so the test harness remains usable during early development

## Manual verification checklist

- Extension detects `+44 20 7946 0958`
- Local UK number `020 7946 0958` becomes `+442079460958`
- Relay request body contains `"number":"+442079460958"`
- FCM payload contains `number: "+442079460958"`
- Android constructs `tel:+442079460958`
- Native dialer opens with the plus sign present

## Troubleshooting

### The `+` disappears
Common causes:
- using form encoding instead of JSON
- sanitizing with a regex that drops non-digits before preserving `+`
- converting `+` to space in query-string style transport
- rebuilding the dial URI from digits only on Android

Fixes:
- send JSON, not URL-encoded form data
- keep E.164 internally as the canonical format
- log the number at each hop
- add tests that assert exact string equality, not just digit equality

### Extension finds nothing on the page
- confirm the content script runs on the current URL
- confirm the detector scans text nodes, not just existing links
- check if the number format requires a default country hint
- use `e2e/test-page.html` to eliminate site-specific DOM issues

### Firebase deploy fails
- verify you are logged into the right Firebase project
- confirm Node runtime version matches project config
- ensure FCM is enabled in the project
- check function logs for request validation failures

### Android receives pushes but won’t open the dialer
- confirm notification tap wiring targets the correct activity or receiver
- confirm `Intent.ACTION_DIAL` is used instead of `ACTION_CALL`
- confirm the URI is `tel:+...`, not just raw digits
- check logcat for intent or notification errors

## Status of this repository snapshot

This repository now includes first-pass implementations for the extension, Firebase relay, Android app scaffold, and the integration/docs layer.

Current verification status:
- Extension: tests and build passing locally
- Firebase relay: tests passing locally
- E2E/docs layer: tests passing locally
- Android: source scaffold is in place, but full build verification depends on Gradle/Android toolchain setup and a real `google-services.json`
