import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Home } from '../screens';
import BottomNavigator from './BottomNavigator';
import * as THEME from '../constants/theme';

const Stack = createStackNavigator();

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={'dark-content'}
        backgroundColor={THEME.COLORS.PRIMARY_GREY}
      />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn && <Stack.Screen name="Home" component={Home} />}
          <Stack.Screen name="BottomNavigator" component={BottomNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
