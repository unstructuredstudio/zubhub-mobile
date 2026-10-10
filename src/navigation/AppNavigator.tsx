import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useStore } from '../store/useStore';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchUserProfile, fetchActivity } from '../services/api';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  unregisterPushNotifications,
} from '../services/notifications';
import { Colors, FontSize } from '../theme';

// ─── Screens ──────────────────────────────────────────────────────────────────
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import HomeScreen from '../screens/main/HomeScreen';
import ActivityDetailScreen from '../screens/main/ActivityDetailScreen';
import SearchScreen from '../screens/main/SearchScreen';
import CreateActivityScreen from '../screens/main/CreateActivityScreen';
import ReviewActivityScreen from '../screens/main/ReviewActivityScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import FacilitationSetupScreen from '../screens/main/FacilitationSetupScreen';
import FacilitationActiveScreen from '../screens/main/FacilitationActiveScreen';
import FacilitationCompleteScreen from '../screens/main/FacilitationCompleteScreen';
import SuggestScreen from '../screens/main/SuggestScreen';
import InspirationDetailScreen from '../screens/main/InspirationDetailScreen';
import EducatorProfileScreen from '../screens/main/EducatorProfileScreen';

/**
 * Untyped on purpose: the navigators here are created without param lists, so a
 * typed ref would only be as accurate as a param list nothing else uses.
 */
const navigationRef = createNavigationContainerRef<any>();

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const CreateStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Auth Navigator ───────────────────────────────────────────────────────────

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Home Stack ───────────────────────────────────────────────────────────────

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStack.Screen name="FacilitationSetup" component={FacilitationSetupScreen} />
      <HomeStack.Screen name="FacilitationActive" component={FacilitationActiveScreen} />
      <HomeStack.Screen name="FacilitationComplete" component={FacilitationCompleteScreen} />
      <HomeStack.Screen name="Suggest" component={SuggestScreen} />
      <HomeStack.Screen name="InspirationDetail" component={InspirationDetailScreen} />
      <HomeStack.Screen name="EducatorProfile" component={EducatorProfileScreen} />
    </HomeStack.Navigator>
  );
}

// ─── Create Stack ─────────────────────────────────────────────────────────────

function CreateNavigator() {
  return (
    <CreateStack.Navigator screenOptions={{ headerShown: false }}>
      <CreateStack.Screen name="CreateActivity" component={CreateActivityScreen} />
      <CreateStack.Screen name="ReviewActivity" component={ReviewActivityScreen} />
    </CreateStack.Navigator>
  );
}

// ─── Profile Stack ───────────────────────────────────────────────────────────

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Tab Icon ─────────────────────────────────────────────────────────────────

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  focused,
  isCreate = false,
}: {
  name: TabIconName;
  focused: boolean;
  isCreate?: boolean;
}) {
  if (isCreate) {
    return (
      <View style={styles.createButton}>
        <Ionicons name="add" size={28} color="#fff" />
      </View>
    );
  }
  return (
    <Ionicons
      name={name}
      size={22}
      color={focused ? Colors.primary : Colors.textMuted}
    />
  );
}

// ─── Main Tab Navigator ───────────────────────────────────────────────────────

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'search' : 'search-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="CreateTab"
        component={CreateNavigator}
        options={{
          title: '',
          tabBarIcon: () => <TabIcon name="add" focused={false} isCreate />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { isInitializing, isAuthenticated, setUser, setInitializing, loadFacilitationCounts } =
    useStore();

  // Load persisted facilitation counts from AsyncStorage
  useEffect(() => {
    loadFacilitationCounts();
  }, []);

  // Opening a notification should land on the thing it is about. Without this
  // a tap just brought the app to the foreground on whatever screen it was
  // last showing, which reads as the notification doing nothing.
  useEffect(() => {
    const openActivity = async (data: any) => {
      const activityId = data?.activity_id;
      if (!activityId || !navigationRef.isReady()) return;
      try {
        // ActivityDetail needs the whole activity, not just an id.
        const activity = await fetchActivity(activityId);
        navigationRef.navigate('Main', {
          screen: 'HomeTab',
          params: {
            screen: 'ActivityDetail',
            params: { activityId, activity },
          },
        });
      } catch {
        // Deleted activity, or offline. Leave the user where they are.
      }
    };

    // Cold start: the app was launched by tapping a notification.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openActivity(response.notification.request.content.data);
    });

    // Warm: tapped while the app was already running.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      openActivity(response.notification.request.content.data);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // Firebase onAuthStateChanged handles both initial session restore
    // and subsequent sign-in / sign-out events in one listener.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await fetchUserProfile(firebaseUser.uid);
          setUser(profile);
          // After sign-in rather than on launch: a permission prompt makes more
          // sense once there is an account for things to happen to. Awaited
          // nowhere -- push setup must not delay showing the app.
          registerForPushNotifications(firebaseUser.uid);
        } catch {
          setUser(null);
        }
      } else {
        const previousId = useStore.getState().user?.id;
        if (previousId) unregisterPushNotifications(previousId);
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isInitializing) {
    return null; // Expo splash screen handles this
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
            <RootStack.Screen name="Auth" component={AuthNavigator} />
          </>
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  createButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
