# Click-to-Call System Build Guide — Codex Adaptation

Source artifact:
- https://claude.ai/public/artifacts/474f56a5-a9f3-4b31-8f03-f98216bc190a

Adapted for OpenClaw + Codex-style orchestration.

## Goal
Build a three-part click-to-call system with an integration/docs layer:
1. Chrome extension
2. Firebase relay
3. Android app
4. Integration tests and docs

## Critical Rule
The `+` in E.164 numbers must survive every stage of the pipeline.

## Component Execution Plan

### Extension
Build Manifest V3 extension, phone utils, content detector, popup UI, service worker, tests, and bundling.

### Relay
Build Firebase Cloud Functions relay with E.164 validation, FCM data messages, and rate limiting.

### Android
Build Kotlin Android app that receives FCM data messages and opens ACTION_DIAL with `tel:+...` preserved.

### Integration / Docs
Build smoke tests, end-to-end pipeline checks, README, and pairing guide.

## Orchestration Notes

- Build locally first
- Use coding agents/subagents per component
- Verify each component separately
- Treat GitHub creation/push as a later outbound step requiring approval
