import { View, Text, SafeAreaView } from 'react-native';
import { NativeUiText, NativeUiHeader } from '@components/';
import React from 'react';
import styles from './Home.style';

const Home = () => {
  return (
    <SafeAreaView style={styles.container}>
      <NativeUiHeader />
    </SafeAreaView>
  );
};

export default Home;
