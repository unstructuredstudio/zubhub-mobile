import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Projects, Search, Profile, Home } from '../screens';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import * as THEME from '../constants/theme';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();

const BottomNavigator = () => {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: THEME.COLORS.PRIMARY_RED,
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          headerShown: false,
          tabBarLabel: t('bottomNavigator.home'),
          tabBarIcon: ({ color }) => (
            <AntDesign name="home" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={Search}
        options={{
          headerShown: false,
          tabBarLabel: t('bottomNavigator.search'),
          tabBarIcon: ({ color }) => (
            <AntDesign name="search1" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Projects"
        component={Projects}
        options={{
          headerShown: false,
          tabBarLabel: t('bottomNavigator.projects'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle-outline" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          headerShown: false,
          tabBarLabel: t('bottomNavigator.profile'),
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomNavigator;
