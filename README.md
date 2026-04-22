# CRM_App3 (Expo Dev Client + React Native + TypeScript)

Mobile CRM app with:
- JWT login
- role-based home flow (`ROLE_A`, `ROLE_B`)
- offline product sync (WatermelonDB)
- real-time location tracking over Socket.IO
- Google Maps provider on iOS/Android

---

## 1) Tech Stack

- Expo SDK 54 + `expo-dev-client`
- React Native 0.81 + TypeScript
- React Navigation Native Stack
- WatermelonDB (local/offline DB)
- Socket.IO client
- `expo-location`
- `react-native-maps`
- AsyncStorage

---

## 2) Features

### Authentication
- Login API call with email/password
- Stores JWT token in AsyncStorage key: `token`
- Stores user profile in AsyncStorage key: `user`
- Auto session restore on app launch
- Logout clears token/user and returns to Login

### Role-based behavior
- `ROLE_A`: live map viewer (`RoleAViewer`)
  - Displays all active `ROLE_B` drivers as custom map markers (car emoji)
  - Marker callout shows driver ID and last update time
  - Current Location button centers map on current device location
- `ROLE_B`: tracker (`RoleBTracker`)
  - Requests location permission
  - Sends location every 10 seconds to socket event `location:update`
  - Shows simple status (sending/disconnected/permission denied)

### Realtime socket data flow (important)

This is the live tracking flow used in this app:

1. `ROLE_B` gets current GPS (`lat`, `lng`) every 10 seconds.
2. `ROLE_B` emits socket event `location:update` with payload:

```json
{
  "userId": "string",
  "lat": 11.5564,
  "lng": 104.9282,
  "updatedAt": "2026-04-20T10:00:00.000Z"
}
```

3. Backend receives this event and **broadcasts** `location:update` to connected clients.
4. `ROLE_A` listens for `location:update` from socket.
5. `ROLE_A` updates the marker for that `userId` in real time.

### Product module
- Create / edit / soft delete / hard delete
- Sync and pending push handling
- Online/offline status support

---

## 3) API / Socket endpoints

Current configured endpoints:

- Login API: `http://192.168.10.132:4000/api/auth/login`
- Socket server: `http://192.168.10.132:4000`
- Product API base (see app code): `http://192.168.10.132:3000/api`

Socket event used by tracking:
- Event name: `location:update`
- Sent by: `ROLE_B`
- Broadcasted by: backend socket server
- Consumed by: `ROLE_A`

> Ensure your backend services are reachable on the same LAN as the device/simulator.

---

## 4) Setup

## Prerequisites

- Node.js LTS
- npm
- Xcode (for iOS)
- CocoaPods
- Android Studio (for Android)

## Install dependencies

```bash
npm install
```

## iOS native dependencies

```bash
npx pod-install
```

## Run app (dev client)

```bash
npm run ios
# or
npx expo run:ios
```

```bash
npm run android
# or
npx expo run:android
```

## Type check

```bash
npx tsc --noEmit
```

---

## 5) Google Maps setup (important)

This project uses `PROVIDER_GOOGLE` in map screen.

Already configured:
- Expo config plugin keys in `app.json`:
  - `iosGoogleMapsApiKey`
  - `androidGoogleMapsApiKey`
- iOS native initialization in `AppDelegate.swift` (`GMSServices.provideAPIKey(...)`)
- iOS Podfile includes `react-native-maps/Google`

Google Cloud requirements:
- Enable **Maps SDK for iOS** and **Maps SDK for Android**
- Enable billing on the project
- iOS key restriction must allow bundle ID: `com.kosalseng.CRM-App3`
- Android key restriction should match package + SHA1

After any native config change, rebuild:

```bash
npx pod-install
npx expo run:ios
```

---

## 6) Location permissions

iOS permission strings are configured in app config and native plist.

If permission dialogs do not appear:
1. uninstall app from simulator/device
2. rebuild app
3. run again

---

## 7) Project structure (high level)

- `src/screens` — Login, Home, Product, Settings
- `src/components` — role views (`RoleAViewer`, `RoleBTracker`) and shared UI
- `src/hooks` — auth, socket, network, background sync
- `src/database` — schema, models, actions, sync
- `src/navigation` — stack types and root navigator

---

## 8) Latest updates

### Latest implemented updates (April 2026)

1. Auth flow
- Added login screen and session persistence
- Added startup auth hydration and logout behavior

2. Role-based home routing
- Home now renders role-specific screen:
  - `ROLE_A` -> map viewer
  - `ROLE_B` -> tracker

3. Real-time tracking
- Added socket hook with JWT auth from AsyncStorage
- Added `location:update` consume/emit flow

4. ROLE_A map
- Google provider enabled (`PROVIDER_GOOGLE`)
- Custom driver marker UI (car emoji)
- Marker callouts include driver + last updated time
- Added Current Location button and user-location display

5. iOS map native setup
- Added Google Maps SDK init in `AppDelegate.swift`
- Added `react-native-maps/Google` pod

6. iOS location permissions
- Added required `NSLocation*UsageDescription` entries
- Added background location mode key

---

## 9) Notes

- Keep secrets out of source for production (move API keys and endpoints to env-based config).
- For release builds, validate Google key restrictions carefully to avoid blank maps.


15