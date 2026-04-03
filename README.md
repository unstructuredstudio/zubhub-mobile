<img src="assets/logo.png" width="350">

# ZubHub Mobile
> An open-source platform for educators to share, discover, and facilitate low-cost creative learning activities. Built with React Native (Expo) and Firebase. 

---

## Features

| Feature | Description |
|---|---|
| **Activity Feed** | Browse educator-submitted activities with ratings and usage counts |
| **AI-Assisted Creation** | Conversational flow guides educators through structuring activities |
| **Facilitation Mode** | Step-by-step guided mode for running activities in workshops |
| **PDF Download** | One-tap offline-ready PDF, works without internet during workshops |
| **WhatsApp Sharing** | Pre-filled messages with UTM tracking for viral growth measurement |
| **Community Notes** | Educators share facilitation experiences after running activities |
| **Engagement Analytics** | Track downloads, shares, views, and notes per activity |
| **Multi-language** | 11 languages including Hindi, Bengali, Tamil, Telugu, Marathi |
| **Notifications** | Activity engagement updates and community interactions |

---

## Tech Stack

- **Framework**: React Native via [Expo](https://expo.dev) SDK 51
- **Backend**: [Firebase](https://firebase.google.com) (Firestore + Auth + Storage)
- **Navigation**: React Navigation v6
- **State**: Zustand (lightweight, no boilerplate)
- **Data Fetching**: TanStack Query (caching, offline support)
- **PDF Generation**: expo-print (client-side, no server needed)
- **AI**: Claude API for activity generation

---

## Project Structure

```
zubhub_new/
├── App.tsx                     # Root component, QueryClient, NetInfo
├── app.json                    # Expo config
├── eas.json                    # EAS Build config (for APK/AAB builds)
├── firestore.rules             # Firestore security rules
├── storage.rules               # Firebase Storage security rules
├── src/
│   ├── config/
│   │   ├── firebase.ts         # Firebase client
│   │   └── ai.ts               # AI config
│   ├── hooks/
│   │   ├── useActivities.ts    # Activity data hooks
│   │   └── useAuth.ts          # Auth hooks
│   ├── i18n/
│   │   ├── index.ts            # i18n setup
│   │   └── translations.ts     # Language strings
│   ├── navigation/
│   │   └── AppNavigator.tsx    # Auth/Main navigator, session handling
│   ├── screens/
│   │   ├── OnboardingScreen.tsx
│   │   ├── SplashScreen.tsx
│   │   ├── auth/
│   │   │   ├── SignInScreen.tsx
│   │   │   └── SignUpScreen.tsx
│   │   └── main/
│   │       ├── HomeScreen.tsx
│   │       ├── ActivityDetailScreen.tsx
│   │       ├── CreateActivityScreen.tsx
│   │       ├── ReviewActivityScreen.tsx
│   │       ├── FacilitationSetupScreen.tsx
│   │       ├── FacilitationActiveScreen.tsx
│   │       ├── FacilitationCompleteScreen.tsx
│   │       ├── AddNoteScreen.tsx
│   │       ├── SearchScreen.tsx
│   │       ├── ProfileScreen.tsx
│   │       ├── EditProfileScreen.tsx
│   │       └── NotificationsScreen.tsx
│   ├── services/
│   │   ├── api.ts              # Firestore queries
│   │   ├── ai.ts               # AI service
│   │   ├── analytics.ts        # Engagement event tracking
│   │   ├── download.ts         # PDF generation + file system
│   │   ├── facilitation.ts     # Facilitation mode logic
│   │   ├── notifications.ts    # Push notifications
│   │   ├── share.ts            # WhatsApp + native share
│   │   ├── translate.ts        # Translation service
│   │   └── upload.ts           # File uploads
│   ├── store/
│   │   └── useStore.ts         # Zustand store (auth, language, offline)
│   ├── theme/
│   │   └── index.ts            # Colors, spacing, shadows, common styles
│   └── types/
│       └── index.ts            # TypeScript interfaces
```

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-org/zubhub-mobile.git
cd zubhub-mobile
npm install
```

### 2. Set Up Firebase

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password)
3. Create a **Firestore** database
4. Enable **Storage**
5. Add a Web app and copy the config values

### 3. Configure Environment

```bash
cp .env.example .env
```

Fill in your Firebase config values in `.env`.

### 4. Run the App

```bash
# Start Expo dev server
npx expo start

# Or directly on Android
npx expo run:android
```

---

## Building an APK (Android)

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK for internal distribution
eas build --platform android --profile preview
```

### Local Build

```bash
npx expo run:android --variant release
```

---

## Low-Bandwidth Optimizations

- **PDF-only downloads**: no large image files, works on 2G
- **FlatList pagination**: loads 10 activities at a time
- **React Query caching**: 5-minute stale time, 30-minute cache — avoids re-fetching
- **StyleSheet over inline styles**: pre-compiled for better render performance
- **No heavy animation libraries**: uses React Native's built-in Animated API
- **Image placeholder gradients**: no network images in activity cards (uses color gradients)
- **Offline detection**: `@react-native-community/netinfo` shows offline banner

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Follow the existing code style (TypeScript, StyleSheet-only, no NativeWind)
4. Test on a low-end Android device or emulator
5. Submit a PR with a clear description

---

## License

MIT — free to use, modify, and distribute. See [LICENSE](LICENSE).

---

## Acknowledgements

Built for the ZubHub community — educators worldwide making creative learning accessible.
