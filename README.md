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

2. Copy environment file:

```bash
cp .env.example .env
```

3. Set API URL in `.env`:

```env
# iOS Simulator / web
EXPO_PUBLIC_API_URL=http://localhost:3000

# Android Emulator
# EXPO_PUBLIC_API_URL=http://10.0.2.2:3000

# Physical device (use your machine's LAN IP)
# EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

4. Start Expo:

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` for simulators.

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
