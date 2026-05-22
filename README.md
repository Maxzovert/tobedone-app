# Tobedone Mobile

React Native Expo app (SDK 54) for team collaboration — projects, tasks, todos, real-time chat, and notifications.

## Prerequisites

- Node.js 18+
- Expo CLI (`npx expo`)
- Running Tobedone backend

## Setup

1. Install dependencies:

```bash
cd mobile
npm install
```

2. Start the backend (separate terminal):

```bash
cd ../backend
npm run dev
```

3. Start Expo:

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` for simulators.

The app **auto-detects** the API URL in dev (same IP as the Expo QR code on a phone; `10.0.2.2` on Android emulator).

**Sign-in fails with "Cannot reach API"?**

1. Confirm backend is running (`http://localhost:3000/health` should return OK).
2. Phone and PC must be on the **same Wi‑Fi** (not mobile data).
3. On Windows, run `scripts/allow-api-firewall.ps1` **as Administrator** to allow port 3000.
4. Reload the app after restarting Expo (`npx expo start -c` clears cache).
5. On the login screen (dev builds), check the **API:** line matches your setup.

## Features

- **Auth** — Register, login, secure token storage (Expo Secure Store)
- **Home** — Dashboard with stats, projects, todos, assigned tasks
- **Projects** — Create, join via invite code, members, discussions, tasks
- **Todos** — Personal list with optimistic toggle
- **Chat** — Real-time messaging, typing indicators, reactions
- **Notifications** — Unread badge, real-time push via Socket.IO
- **Profile & Settings** — Edit profile, light/dark/system theme

## Architecture

```
app/           Expo Router screens
components/    UI and feature components
stores/        Zustand (auth, chat, notifications, ui)
services/      API layer
hooks/         useTheme, useSocket
providers/     React Query, theme
lib/           API client, Socket.IO
constants/     Design tokens
types/         TypeScript interfaces
```

## State Management

- **Zustand** — auth, chat, notifications, UI theme
- **TanStack Query** — server state, caching, optimistic updates

## Navigation

- `(auth)` — Login, Register
- `(app)/(tabs)` — Home, Projects, Todos, Notifications
- `(app)/project/[id]` — Project detail
- `(app)/chat/[groupId]` — Chat channel
- `(app)/profile`, `(app)/settings` — Modals
