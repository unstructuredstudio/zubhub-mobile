import { ActivityIndicator } from 'react-native';
import React from 'react';
import * as THEME from '../constants/theme';

const NativeUiActivityIndicator = () => {
  return <ActivityIndicator color={THEME.COLORS.PRIMARY_TEAL} size={40} />;
};

export default NativeUiActivityIndicator;
