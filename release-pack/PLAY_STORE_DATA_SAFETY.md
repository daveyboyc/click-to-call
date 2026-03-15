# Google Play Store - Data Safety Form Answers

## Data Collection

**Does your app collect or share any of the required user data types?**  
Yes - Device or other IDs

**Is data collected encrypted in transit?**  
Yes

**Do you provide a way for users to request data deletion?**  
Yes - Users can uninstall the app or re-pair to generate a new token

---

## Data Types

### Device or other IDs
- **Collected:** Yes
- **Shared with others:** No
- **Encrypted in transit:** Yes
- **Purpose:** To route phone number requests from the browser extension to the correct paired device

---

## Security Practices

**We use:**
- HTTPS/TLS for all data in transit
- Firebase Cloud Messaging for push notifications
- No personal data is stored on external servers beyond the device token

---

## Explanations

### Why is this data collected?
The device token is required to route clicked phone numbers from the browser extension to the user's paired Android device. Without this token, the app cannot receive call requests.

### Is data shared with third parties?
No. The device token is only used to deliver phone numbers from the relay service to the paired device.

### How can users delete data?
Users can uninstall the app, which removes the token. They can also re-pair with a new token by reinstalling the app.

---

## Play Store Specific

**App category:** Productivity

**Content rating:** Everyone

**Target audience:** Adults, Teens

**Release notes for first version:**
Initial release of Click to Call - send phone numbers from your browser to your Android device for instant dialing.
