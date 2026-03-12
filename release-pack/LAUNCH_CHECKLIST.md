# Launch checklist

## Ready now
- [x] GitHub branch pushed: `hardening/ship-it`
- [x] Chrome extension zip created
- [x] Android debug APK created
- [x] Android release AAB created
- [x] Draft privacy policy created
- [x] Draft Chrome Web Store listing created
- [x] Draft Google Play listing created

## Files in this folder
- `click-to-call-extension-v1.0.0.zip`
- `click-to-call-android-debug-v1.0.0.apk`
- `click-to-call-android-release-unsigned-v1.0.0.apk`
- `click-to-call-android-release-v1.0.0.aab`
- `CHROME_WEB_STORE_LISTING.md`
- `GOOGLE_PLAY_LISTING.md`
- `PRIVACY_POLICY.md`

## Chrome Web Store
1. Log into Chrome Web Store Developer Dashboard
2. Create new item
3. Upload `click-to-call-extension-v1.0.0.zip`
4. Paste copy from `CHROME_WEB_STORE_LISTING.md`
5. Add screenshots
6. Publish or submit for review

## Google Play Console
1. Log into Play Console
2. Create app: Click to Call
3. Set package name to `com.clicktocall`
4. Upload `click-to-call-android-release-v1.0.0.aab`
5. Paste copy from `GOOGLE_PLAY_LISTING.md`
6. Add privacy policy URL/content
7. Complete Data safety, App content, and target audience forms
8. Add screenshots and app icon assets
9. Release to Internal testing first

## Important note on release signing
The AAB was generated successfully and is the correct artifact for Play Console upload.
If Play Console requests signing adjustments, use Play App Signing and keep the final signing config documented before full production rollout.

## Suggested launch order
1. Chrome Web Store
2. Internal Play testing
3. Closed Play testing
4. Public rollout
