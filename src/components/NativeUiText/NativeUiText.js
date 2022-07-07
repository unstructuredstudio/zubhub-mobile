import React from 'react';
import { Text } from 'react-native';
import {
  useFonts,
  Raleway_300Light,
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
  Raleway_700Bold,
} from '@expo-google-fonts/raleway';
import AppLoading from 'expo-app-loading';

const NativeUiText = ({
  children,
  textType = 'regular',
  style,
  textColor,
  fontSize,
}) => {
  let [fontsLoaded] = useFonts({
    Raleway_300Light,
    Raleway_400Regular,
    Raleway_500Medium,
    Raleway_600SemiBold,
    Raleway_700Bold,
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }
  return (
    <Text
      style={[
        style,
        {
          fontSize: fontSize && fontSize,
          color: textColor && textColor,
          fontFamily:
            textType === 'light'
              ? 'Raleway_300Light'
              : textType === 'regular'
              ? 'Raleway_400Regular'
              : textType === 'medium'
              ? 'Raleway_500Medium'
              : textType === 'semiBold'
              ? 'Raleway_600SemiBold'
              : textType === 'bold' && 'Raleway_700Bold',
        },
      ]}
    >
      {children}
    </Text>
  );
};

export default NativeUiText;
