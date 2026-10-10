/**
 * `getReactNativePersistence` exists in the React Native build of
 * `@firebase/auth` and is what `firebase/auth` re-exports at runtime, because
 * Metro resolves that package through its `react-native` export condition.
 *
 * The umbrella `firebase/auth` typings do not follow that condition, so
 * TypeScript alone cannot see the symbol. This declares what the bundler
 * actually provides rather than casting it away at the call site.
 */
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
