import { View } from 'react-native';
import React from 'react';
import { NativeUiText } from '..';
import styles from './ErrorCard.style';
import * as THEME from '../../constants/theme';

const ErrorCard = ({ error }) => {
  return (
    <View style={styles.main}>
      <NativeUiText
        fontSize={16}
        textType={'medium'}
        textColor={THEME.COLORS.PRIMARY_RED}
      >
        What went wrong?
      </NativeUiText>
      {error.map((errorMessage, index) => (
        <View key={index} style={styles.errorBox}>
          <View style={styles.bullet}></View>
          <NativeUiText textColor={THEME.COLORS.PRIMARY_RED}>
            {errorMessage}{' '}
          </NativeUiText>
        </View>
      ))}
    </View>
  );
};

export default ErrorCard;
