import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useStore } from '../store/useStore';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchUserProfile } from '../services/api';
import { Colors, FontSize } from '../theme';

// ─── Screens ──────────────────────────────────────────────────────────────────
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import HomeScreen from '../screens/main/HomeScreen';
import ActivityDetailScreen from '../screens/main/ActivityDetailScreen';
import AddNoteScreen from '../screens/main/AddNoteScreen';
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
      <HomeStack.Screen name="AddNote" component={AddNoteScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStack.Screen name="FacilitationSetup" component={FacilitationSetupScreen} />
      <HomeStack.Screen name="FacilitationActive" component={FacilitationActiveScreen} />
      <HomeStack.Screen name="FacilitationComplete" component={FacilitationCompleteScreen} />
      <HomeStack.Screen name="Suggest" component={SuggestScreen} />
      <HomeStack.Screen name="InspirationDetail" component={InspirationDetailScreen} />
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

  useEffect(() => {
    // Firebase onAuthStateChanged handles both initial session restore
    // and subsequent sign-in / sign-out events in one listener.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await fetchUserProfile(firebaseUser.uid);
          setUser(profile);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isInitializing) {
    return null; // Expo splash screen handles this
  }

  return (
    <NavigationContainer>
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
