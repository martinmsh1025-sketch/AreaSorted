# Internal Build Guide

## 1. One-time setup

```bash
cd provider-app
npm install
npx eas-cli login
npx eas-cli init
```

Then update these placeholders:

- `provider-app/app.json` -> `extra.eas.projectId`
- `provider-app/eas.json` -> `submit.production.ios.ascAppId`
- `provider-app/.env` or shell env -> `EXPO_PUBLIC_API_BASE_URL`

## 2. Preflight checks

```bash
npm run doctor
npm run typecheck
```

## 3. Android internal testing

```bash
npm run build:android:preview
```

Recommended first release path:

- upload to Google Play internal testing
- verify real provider login
- verify order actions and push permission flow

## 4. iOS internal testing

```bash
npm run build:ios:preview
```

Recommended path:

- upload to TestFlight
- test on a real iPhone
- verify notifications, secure login persistence, and order deep links

## 5. Push payload format

Use one of these payload data shapes:

```json
{
  "path": "/(tabs)/notifications"
}
```

```json
{
  "bookingId": "ck_booking_id_here"
}
```

## 6. Before store submission

- replace generated placeholder assets in `provider-app/assets/`
- confirm privacy policy and support URL
- set real production API base URL
- replace temporary push token file store with DB-backed storage if moving beyond initial rollout
