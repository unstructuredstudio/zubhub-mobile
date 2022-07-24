import { View, ScrollView, FlatList, Pressable } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiInput,
  NativeUiButton,
} from '@components/';
import * as THEME from '../../constants/theme';
import styles from './ForgetPassword.style';
import DefaultStyles from '../../constants/DefaultStyles.style';
import Entypo from 'react-native-vector-icons/Entypo';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useNavigation } from '@react-navigation/native';

const ForgetPassword = () => {
  const navigation = useNavigation();

  const ref = useRef(null);
  const [currentElemIndex, setCurrentElemIndex] = useState(0);
  const [componentsArray, setComponentsArray] = useState([]);

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
