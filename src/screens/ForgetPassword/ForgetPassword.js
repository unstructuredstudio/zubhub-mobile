import { View } from 'react-native';
import React from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiInput,
  NativeUiButton,
} from '@components/';
import * as THEME from '../../constants/theme';
import styles from './ForgetPassword.style';

const ForgetPassword = () => {
  return (
    <View style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={'Forget Password'} />

      <View style={styles.topContainer}>
        <View style={[styles.introContainer]}>
          <NativeUiText fontSize={THEME.FONT_SIZE.LARGE} textType={'medium'}>
            Password Reset
          </NativeUiText>
          <NativeUiText
            style={styles.createAccount}
            textColor={THEME.COLORS.SECONDARY_TEXT}
            textType={'medium'}
          >
            Enter your email so we can send you a pass word reset link
          </NativeUiText>
        </View>
      </View>

      <View style={styles.container}>
        <View style={[styles.introContainer, styles.topContainer]}>
          <View style={styles.input}>
            <NativeUiInput label={'Enter your email'} placeholder={' Email'} />
          </View>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <NativeUiButton label={'Send reset link'} />
      </View>
    </View>
  );
};

export default ForgetPassword;
