import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Text } from 'react-native';
import {
  useFonts,
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
  Raleway_700Bold,
  Raleway_800ExtraBold,
} from '@expo-google-fonts/raleway';

import AppNavigator from './src/navigation/AppNavigator';
import { useStore } from './src/store/useStore';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// React Query client — short stale time for low-bandwidth users
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,         // 30 minutes cache
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,    // Avoid unnecessary refetches on low bandwidth
      refetchOnReconnect: true,
    },
  },
});

function AppContent() {
  const { isInitializing, setOffline } = useStore();

  useEffect(() => {
    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(!state.isConnected);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isInitializing) {
      SplashScreen.hideAsync();
    }
  }, [isInitializing]);

  return <AppNavigator />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Raleway_400Regular,
    Raleway_500Medium,
    Raleway_600SemiBold,
    Raleway_700Bold,
    Raleway_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Apply Raleway as the default font for every Text in the app.
      // Bold/heavy text must still specify the correct variant explicitly
      // (e.g. fontFamily: 'Raleway_700Bold') because iOS ignores fontWeight
      // when fontFamily is set.
      (Text as any).defaultProps = (Text as any).defaultProps ?? {};
      (Text as any).defaultProps.style = { fontFamily: 'Raleway_400Regular' };
    }
  }, [fontsLoaded, fontError]);

  // Keep splash visible while fonts are loading
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <AppContent />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
