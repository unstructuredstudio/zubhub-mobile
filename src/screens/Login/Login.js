import { View, Pressable } from 'react-native';
import React, { useRef, useState } from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiInput,
  NativeUiButton,
  NativeUiActivityIndicator,
  ErrorCard,
  NativeUiModal,
} from '@components/';
import * as THEME from '../../constants/theme';
import styles from './Login.style';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { loginUser } from '../../redux/actions/authAction';
import { useDispatch } from 'react-redux';

const initialValues = {
  username: '',
  password: '',
};

const validationSchema = Yup.object({
  username: Yup.string().trim().required('We need your username to proceed'),
  password: Yup.string()
    .trim()
    .required('Seems like you forgot this')
    .min(8, 'Provide a strong password here'),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const ref = useRef(null);

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
    console.log(userData, 'inkdcoskl');
    if (userData.username === '' && userData.password === '') {
      setLoading(false);
      err.push(`Ensure to fill all fields before proceeding`);
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
        setError(
          Object.values([
            `Uh oh, seems like we hit a snag :( Maybe try again later?`,
          ])
        );
      }
    });
  };

  return (
    <View style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={'Login'} />

      <NativeUiModal
        navigation={navigation}
        visible={visible}
        setVisible={setVisible}
        description={' Your login was successful. Welcome onboard!'}
      />

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
        {error.length > 0 && <ErrorCard error={error} />}
      </View>
      <Formik initialValues={initialValues} validationSchema={validationSchema}>
        {({ errors, touched, handleBlur, setFieldValue, setFieldTouched }) => {
          return (
            <View style={[styles.container, styles.topContainer]}>
              <View style={styles.input}>
                <NativeUiInput
                  label={'Username or Email'}
                  placeholder={'Username or Email'}
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
                  label={'Enter your password'}
                  placeholder={'Password'}
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
                    Forget Password?
                  </NativeUiText>
                </Pressable>
              </View>
            </View>
          );
        }}
      </Formik>

      <View style={styles.bottomContainer}>
        {!loading ? (
          <NativeUiButton label={'Login'} onPress={onLogin} />
        ) : (
          <NativeUiActivityIndicator />
        )}

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
