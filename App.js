import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Navigation from './src/navigation/Navigation';

const App = () => {
  return (
    <View style={styles.container}>
      <Navigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
