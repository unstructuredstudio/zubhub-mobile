import { View, ScrollView } from 'react-native';
import React from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiInput,
  NativeUiButton,
} from '@components/';
import * as THEME from '../../constants/theme';
import styles from './Register.style';
import DefaultStyles from '../../constants/DefaultStyles.style';

const Register = () => {
  return (
    <View style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={'Register'} />
      <ScrollView style={styles.container}>
        <View style={styles.topContainer}>
          <View style={styles.introContainer}>
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

          <View style={DefaultStyles.containerSpaced}>
            <View style={[styles.box]}>
              <View style={[DefaultStyles.containerRow]}>
                <View style={styles.circle} />
                <View style={styles.line} />
              </View>
              <NativeUiText style={styles.step}>Step 1</NativeUiText>
            </View>
            <View style={[styles.box]}>
              <View style={[DefaultStyles.containerRow]}>
                <View style={styles.circle} />
                <View style={styles.line} />
              </View>
              <NativeUiText style={styles.step}>Step 2</NativeUiText>
            </View>
            <View style={[styles.box]}>
              <View style={[DefaultStyles.containerRow]}>
                <View style={styles.circle} />
              </View>
              <NativeUiText style={styles.step}>Step 3</NativeUiText>
            </View>
          </View>
        </View>

        <View style={[styles.topContainer, styles.introContainer]}>
          <View style={styles.input}>
            <NativeUiInput label={'Username'} placeholder={'Username'} />
          </View>
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
          <View style={styles.input}>
            <NativeUiInput
              label={'Confirm your password'}
              placeholder={'Password'}
            />
          </View>

          <NativeUiButton label={'Next'} />
          <NativeUiText textType="medium" style={styles.member}>
            Already a member ?{' '}
            <NativeUiText
              textColor={THEME.COLORS.PRIMARY_TEAL}
              textType={'medium'}
            >
              Login
            </NativeUiText>
          </NativeUiText>
        </View>
      </ScrollView>
    </View>
  );
};

export default Register;
