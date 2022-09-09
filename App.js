import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import Navigation from './src/navigation/Navigation';
import * as THEME from './src/constants/theme';
import Constants from 'expo-constants';
import store from './src/redux/store';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';
import './src/locales/i18n.config';

const App = () => {
  return (
    <View style={styles.container}>
      <Provider store={store}>
        <StatusBar backgroundColor={THEME.COLORS.PRIMARY_RED} />
        <Navigation />
      </Provider>
      <Toast />
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
