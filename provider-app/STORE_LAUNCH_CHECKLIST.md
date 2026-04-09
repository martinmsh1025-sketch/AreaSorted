# Provider App Store Launch Checklist

## Technical

- Set `EXPO_PUBLIC_API_BASE_URL` to production API
- Set EAS project ID in Expo config
- Replace placeholder assets with production icon, splash, and notification assets
- Test real provider login on iOS and Android devices
- Verify push token registration in production
- Confirm provider mobile endpoints work against production DB

## Apple App Store

- Create App Store Connect app record
- Add privacy policy URL
- Add support URL
- Add account deletion support statement if required by final auth flow
- Prepare screenshots for iPhone sizes
- Prepare app review notes and demo provider account

## Google Play

- Create Play Console app
- Prepare feature graphic, icon, screenshots, and short/full descriptions
- Complete Data safety form
- Add privacy policy URL
- Upload internal test build before production rollout

## Product Scope For V1

- Provider login
- Order inbox and status actions
- Notifications feed
- Availability overview
- Account summary

## Recommended Before Submission

- Add crash reporting
- Add analytics for login/order actions
- Add proper profile and payout screens
- Add support request flow in-app
