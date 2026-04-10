# Edge Add-ons Store Submission

The Click to Call extension is fully compatible with Microsoft Edge. No code changes are needed — Edge supports Manifest V3 and all the Chrome APIs used by this extension (`chrome.storage.sync`, `chrome.runtime.onMessage`, content scripts, service workers).

## How to submit

1. Go to https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview
2. Sign in with a Microsoft account (create one if needed — free for individuals)
3. Register as a developer (one-time, no fee for individuals)
4. Click **Create new extension**
5. Upload the same `dist/` ZIP package you built for Chrome

## Store listing details

Use the same details as the Chrome Web Store submission:

- **Name:** Click to Call
- **Description:** Detect phone numbers on web pages and send them to your paired Android device for one-tap dialing.
- **Category:** Productivity
- **Privacy policy URL:** https://daveyboyc.github.io/click-to-call/privacy.html

## Screenshots

Edge requires at least one screenshot (1280x800 or 640x480). You can reuse Chrome Web Store screenshots.

## Review timeline

Edge Add-ons reviews typically take 1-3 business days, often faster than Chrome Web Store.

## Work PC installation

Once published on the Edge Add-ons Store, the extension can be installed on managed Windows PCs where Edge is available. Many corporate environments allow Edge Add-ons even when Chrome Web Store is restricted by group policy.

If your IT department uses Microsoft Intune or Group Policy to manage Edge, they can also force-install the extension for specific users using the extension ID from the Edge Add-ons dashboard.
