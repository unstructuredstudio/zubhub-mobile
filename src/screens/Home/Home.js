import { View, Text, SafeAreaView } from 'react-native';
import React from 'react';
import { NativeUiText } from '../../components';

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
