import { View, Pressable } from 'react-native';
import React, { useRef } from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiInput,
  NativeUiButton,
} from '@components/';
import * as THEME from '../../constants/theme';
import styles from './Login.style';
import { useNavigation } from '@react-navigation/native';

const Login = () => {
  const navigation = useNavigation();

  const ref = useRef(null);

  return (
    <View style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={'Login'} />

      <View style={styles.topContainer}>
        <View style={[styles.introContainer]}>
          <NativeUiText fontSize={THEME.FONT_SIZE.LARGE} textType={'medium'}>
            Lets get started
          </NativeUiText>
          <NativeUiText
            style={styles.createAccount}
            textColor={THEME.COLORS.SECONDARY_TEXT}
            textType={'medium'}
          >
            Lets create an account first!!
          </NativeUiText>
        </View>
      </View>

      <View style={styles.container}>
        <View style={[styles.introContainer, styles.topContainer]}>
          <View style={styles.input}>
            <NativeUiInput
              label={'Enter your email or phone number'}
              placeholder={'Email or phone number'}
            />
          </View>
          <View style={styles.input}>
            <NativeUiInput
              label={'Enter your password'}
              placeholder={'Password'}
            />
          </View>
        </View>
        <Pressable
          onPress={() => navigation.navigate('ForgetPassword')}
          style={styles.forgetPwd}
        >
          <NativeUiText textType="medium" textColor={THEME.COLORS.PRIMARY_TEAL}>
            Forget Password?
          </NativeUiText>
        </Pressable>
      </View>

      <View style={styles.bottomContainer}>
        <NativeUiButton
          label={'Login'}
          onPress={() => navigation.navigate('BottomNavigator')}
        />
        <Pressable onPress={() => navigation.navigate('Register')}>
          <NativeUiText textType="medium" style={styles.member}>
            Don’t have an account yet?
            <NativeUiText
              textColor={THEME.COLORS.PRIMARY_TEAL}
              textType={'medium'}
            >
              {' '}
              Register
            </NativeUiText>
          </NativeUiText>
        </Pressable>
      </View>
    </View>
  );
};

export default Login;
