import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

// Prevent re-initialising on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firestore's default streaming connection often fails to open in React Native
// on Android ("Could not reach Cloud Firestore backend"), leaving writes queued
// on the phone. Long polling is the transport Firebase recommends there. Hot
// reload re-runs this file, and Firestore can only be initialised once.
function createFirestore() {
  try {
    return initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch {
    return getFirestore(app);
  }
}
export const db      = createFirestore();
export const auth    = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const storage = getStorage(app);
