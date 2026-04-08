# CRM App 3 (Expo + React Native)

CRM App 3 is a mobile CRM/inventory demo application built with Expo and React Native.
It supports role-based login, product management, offline-first local storage, and background sync.

## Project Overview

### Main capabilities
- Role-based authentication (`ROLE_A` and `ROLE_B`).
- Product catalog management (create, update, soft delete, hard delete).
- Offline-first local database using WatermelonDB + SQLite.
- Sync flow with remote API (`/sync/pull` and `/sync/push`).
- Network-aware behavior (online/offline state handling).
- Background push sync when internet becomes available.
- Localization support (English and Khmer).

### Tech stack
- Expo SDK 54
- React Native 0.81
- TypeScript
- React Navigation (native stack)
- WatermelonDB + react-native-quick-sqlite
- NetInfo for connectivity detection
- i18n-js + expo-localization

## Setup Guide

### 1) Prerequisites
- Node.js (LTS recommended)
- npm
- Xcode (for iOS)
- Android Studio + Android SDK (for Android)
- Expo CLI tooling (via `npx expo ...` commands)

### 2) Install dependencies
```bash
npm install
```

### 3) Configure API base URL
The app currently uses this base URL in API files:
- `src/api/auth.ts`
- `src/api/product.ts`

Current value:
```ts
const API_URL = 'http://192.168.10.85:3000/api';
```

Update it to your backend host/IP if needed.

### 4) Run the project
```bash
# start dev server
npm run start

# run iOS native build
npm run ios

# run Android native build
npm run android
```

### 5) Login test accounts
Manager A  
Email: `manager.test.1775622641578@example.com`  
Password: `Manager123!`

Staff B  
Email: `staff.test.1775622641578@example.com`  
Password: `Staff12345!`

## App Flow

1. User signs in from Login screen.
2. Role is derived from API response:
	 - `ROLE_A` → Role A Home screen
	 - `ROLE_B` → Main Home screen
3. `ROLE_B` can navigate to Product management and Settings.
4. Product changes are stored locally and synced when online.

## Offline and Sync Behavior

- Product data is persisted in local SQLite through WatermelonDB.
- When offline:
	- CRUD continues locally.
	- Pending changes remain queued locally.
- When online:
	- Manual refresh triggers full sync.
	- Background service pushes pending local changes automatically.

## Localization

- Supported languages: English (`en`) and Khmer (`km`).
- Language selection is persisted via AsyncStorage.

## High-level Folder Structure

- `src/api` → remote API requests (`auth`, `product`, sync endpoints)
- `src/database` → schema, models, actions, and sync logic
- `src/screens` → Login, Home, Product, Role A, Settings screens
- `src/hooks` → background sync + network status hooks
- `src/contexts` → Language context/provider
- `src/i18n` → translations and i18n setup
- `src/navigation` → root stack navigation

## Notes

- This project is configured with Expo Dev Client.
- iOS native project files are included under `ios/`.
- If backend is unreachable, authentication and sync-dependent operations will fail.