import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import Navigation from './src/navigation/Navigation';
import * as THEME from './src/constants/theme';
import Constants from 'expo-constants';

const App = () => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={THEME.COLORS.PRIMARY_RED} />
      <Navigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.PRIMARY_RED,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
  },
});

export default App;
