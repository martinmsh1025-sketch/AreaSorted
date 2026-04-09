# AreaSorted Provider App

Expo/React Native scaffold for a provider-facing mobile app.

## MVP scope

- provider sign-in entry
- orders inbox and detail preview
- notifications feed
- availability overview
- account summary

## Backend endpoints already added

- `POST /api/mobile/provider/login`
- `GET /api/mobile/provider/me`
- `GET /api/mobile/provider/orders`
- `POST /api/mobile/provider/orders/[id]/decision`
- `GET /api/mobile/provider/notifications`
- `POST /api/mobile/provider/notifications/mark-read`
- `GET /api/mobile/provider/availability`
- `POST /api/mobile/provider/availability`
- `POST /api/mobile/provider/availability/overrides`
- `DELETE /api/mobile/provider/availability/overrides?id=...`
- `POST /api/mobile/provider/push/register`

## Run locally

```bash
cd provider-app
npm install
npm run dev
```

Set the API base URL when you are ready to connect it to the live backend:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm run dev
```

Run in demo mode with no backend or DB:

```bash
EXPO_PUBLIC_DEMO_MODE=true npm run dev
```

For iOS simulator access to your local Next app, change the base URL to your Mac's LAN IP.

## Current integration status

- Uses real mobile JSON endpoints when login succeeds.
- Falls back to mock preview data if the local backend is unavailable.
- Demo mode can force the whole app into built-in sample data without calling the backend.
- API client is separated under `src/lib/api.ts` and `src/lib/provider-api.ts`.
- Mobile auth is token-based and isolated from the web cookie session.
- Push token registration is scaffolded with Expo Notifications plus a temporary file-backed store.

## Internal build commands

```bash
npm run build:android:preview
npm run build:ios:preview
```

Useful checks before building:

```bash
npm run doctor
npm run typecheck
```

Full internal distribution steps live in `provider-app/INTERNAL_BUILD_GUIDE.md`.

Before TestFlight / Play internal testing:

- replace `provider-app/app.json` EAS project id
- replace the generated placeholder assets in `provider-app/assets/`
- set production `EXPO_PUBLIC_API_BASE_URL`
- log in with a real provider account on a physical device

## Push notification routing

- If a push payload contains `path`, the app opens that route.
- If a push payload contains `bookingId`, the app opens `orders/[id]`.
- Otherwise the app falls back to the notifications tab.

## Recommended next backend additions

1. Add provider order detail + support request screens.
2. Add provider payout and profile edit screens.
3. Replace the temporary file-backed push token store with a database-backed table.
4. Add EAS project ID, production icons, splash assets, and real store metadata.
