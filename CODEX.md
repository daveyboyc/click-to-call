# Click-to-Call

## Project
Three-component click-to-call system: Chrome extension → Firebase relay → Android dialer app.

## Architecture
Extension detects phone numbers in browser DOM, sends E.164 formatted number via HTTPS POST to a Firebase Cloud Function, which pushes an FCM data message to the paired Android device. Android app shows a notification; tap opens the native dialer with number pre-filled.

## Critical Constraint
The '+' character in international phone numbers MUST survive every hop in the pipeline. Every component must preserve E.164 format (e.g. +442079460958).

## Repo Structure
click-to-call/
├── CODEX.md
├── README.md
├── extension/
├── firebase/
├── android/
├── e2e/
└── docs/
    └── spec.md

## Standards
- Extension: Manifest V3, ES modules, bundled with webpack
- Relay: Node.js 18, Firebase Cloud Functions v2
- Android: Kotlin, minSdk 26, targetSdk 34
- All components: tests must pass before completion
- Phone numbers: always E.164 format internally (+[country][number], no spaces)

## Test Commands
- Extension: `cd extension && npm test`
- Relay: `cd firebase/functions && npm test`
- Android: `cd android && ./gradlew test`
- E2E: `cd e2e && npm test`
