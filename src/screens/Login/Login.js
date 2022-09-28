import { View, Pressable, ScrollView } from 'react-native';
import React, { useRef, useState } from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiInput,
  NativeUiButton,
  NativeUiActivityIndicator,
  ErrorCard,
  NativeUiModal,
  NativeKeyboardAvoidingView,
} from '@components/';
import * as THEME from '../../constants/theme';
import styles from './Login.style';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { loginUser } from '../../redux/actions/authAction';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

const initialValues = {
  username: '',
  password: '',
};

const validationSchema = Yup.object({
  username: Yup.string().trim().required('general.usernameBlank'),
  password: Yup.string()
    .trim()
    .required('general.seemsLikeYouForgot')
    .min(8, 'general.strongPassword'),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [userData, setUserData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState([]);

  const changeText = (e, key) => {
    const data = { ...userData };
    data[key] = e;
    setUserData(data);
  };

  const onLogin = () => {
    setLoading(true);
    const server_errors = {};
    let err = [];
    if (userData.username === '' && userData.password === '') {
      setLoading(false);
      err.push(t('general.fillAllFields'));
      return setError(err);
    }

    let result = dispatch(loginUser(userData, setVisible, setLoading));
    result.catch((error) => {
      setLoading(false);
      let messages = JSON.parse(error.message);

      if (typeof messages === 'object') {
        Object.keys(messages).forEach((key) => {
          if (key === 'non_field_errors') {
            server_errors['non_field_errors'] = messages[key][0];
          } else if (key === 'location') {
            server_errors['user_location'] = messages[key][0];
          } else {
            server_errors[key] = messages[key][0];
          }
        });

        setError(Object.values(server_errors));
      } else {
        setError(Object.values([t('general.smagError')]));
      }
    });
  };

  return (
    <NativeKeyboardAvoidingView style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={t('general.login')} />

      <NativeUiModal
        navigation={navigation}
        visible={visible}
        setVisible={setVisible}
        description={t('login.loginSuccess')}
        navigateTo={'BottomNavigator'}
        label={t('general.goToHome')}
      />

      <ScrollView style={styles.container}>
        <View style={styles.topContainer}>
          <View style={[styles.introContainer]}>
            <NativeUiText fontSize={THEME.FONT_SIZE.LARGE} textType={'medium'}>
              {t('general.getStarted')}
            </NativeUiText>
            <NativeUiText
              style={styles.createAccount}
              textColor={THEME.COLORS.SECONDARY_TEXT}
              textType={'medium'}
            >
              {t('general.createAccountFirst')}
            </NativeUiText>
          </View>
          {error.length > 0 && <ErrorCard setError={setError} error={error} />}
        </View>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
        >
          {({
            errors,
            touched,
            handleBlur,
            setFieldValue,
            setFieldTouched,
          }) => {
            return (
              <View style={[styles.container, styles.topContainer]}>
                <View style={styles.input}>
                  <NativeUiInput
                    label={t('general.userNameOrEmail')}
                    placeholder={t('general.userNameOrEmail')}
                    onChangeText={(e) => {
                      setFieldValue('username', e);
                      setFieldTouched('username', true, false);
                      changeText(e, 'username');
                    }}
                    onBlur={handleBlur('username')}
                    error={touched.username && errors.username}
                  />
                </View>

                <View style={styles.input}>
                  <NativeUiInput
                    password
                    label={t('general.enterPassword')}
                    placeholder={t('general.password')}
                    onChangeText={(e) => {
                      setFieldValue('password', e);
                      setFieldTouched('password', true, false);
                      changeText(e, 'password');
                    }}
                    onBlur={handleBlur('password')}
                    error={touched.password && errors.password}
                  />
                  <Pressable
                    onPress={() => navigation.navigate('ForgetPassword')}
                    style={styles.forgetPwd}
                  >
                    <NativeUiText
                      textColor={THEME.COLORS.PRIMARY_TEAL}
                      textType={'medium'}
                    >
                      {t('general.forgetPassword')}?
                    </NativeUiText>
                  </Pressable>
                </View>
              </View>
            );
          }}
        </Formik>

        <View style={styles.bottomContainer}>
          {!loading ? (
            <NativeUiButton label={t('general.login')} onPress={onLogin} />
          ) : (
            <NativeUiActivityIndicator />
          )}

          <Pressable onPress={() => navigation.navigate('Register')}>
            <NativeUiText textType="medium" style={styles.member}>
              {t('login.dontHaveAnAccount')}
              <NativeUiText
                textColor={THEME.COLORS.PRIMARY_TEAL}
                textType={'medium'}
              >
                {t('general.register')}
              </NativeUiText>
            </NativeUiText>
          </Pressable>
        </View>
      </ScrollView>
    </NativeKeyboardAvoidingView>
  );
};

export default Login;
