import { View, Text, SafeAreaView } from 'react-native';
import { NativeUiText } from '@components';
import React from 'react';

const Home = () => {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: 'white',
      }}
    >
      <NativeUiText fontSize={21}>Home</NativeUiText>
      <Text>this is the home</Text>
    </SafeAreaView>
  );
};

export default Home;
