import { View } from 'react-native';
import React from 'react';
import NativeUiText from '../NativeUiText/NativeUiText';
import styles from './ToastUi.style';

const ToastUi = ({ text2 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftBox} />
      <View style={styles.textContainer}>
        <NativeUiText
          fontSize={16}
          textType="medium"
          style={styles.errorText}
          textColor={'white'}
        >
          Error
        </NativeUiText>
        <NativeUiText style={styles.desc} textColor={'white'}>
          {text2}
        </NativeUiText>
      </View>
    </View>
  );
};

export default ToastUi;
