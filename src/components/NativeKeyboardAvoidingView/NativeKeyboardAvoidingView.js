import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import styles from './NativeKeyboardAvoidingView.style';

const NativeKeyboardAvoidingView = ({ children }) => {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {children}
    </KeyboardAvoidingView>
  );
};

export default NativeKeyboardAvoidingView;
