import { View } from 'react-native';
import React, { useState, useEffect } from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiInput,
  NativeUiButton,
  ErrorCard,
  NativeUiModal,
  NativeUiActivityIndicator,
} from '@components/';
import * as THEME from '../../constants/theme';
import styles from './ForgetPassword.style';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { resetPassordLink } from '../../redux/actions/authAction';
import { useDispatch } from 'react-redux';

const initialValues = {
  email: '',
};

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Uhmm...The email seems to be invalid 🤔')
    .required('Please ensure to fill this field'),
});

const ForgetPassword = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [userData, setUserData] = useState({
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState([]);

  const changeText = (e, key) => {
    const data = { ...userData };
    data[key] = e;
    setUserData(data);
  };

  const onResetClick = () => {
    setLoading(true);
    const server_errors = {};
    let err = [];
    if (userData.email === '') {
      setLoading(false);
      err.push(`Ensure to fill all fields before proceeding`);
      return setError(err);
    }

    let result = dispatch(
      resetPassordLink(userData.email, setVisible, setLoading)
    );
    result.catch((error) => {
      setLoading(false);
      const messages = JSON.parse(error.message);
      if (typeof messages === 'object') {
        const server_errors = {};
        Object.keys(messages).forEach((key) => {
          if (key !== 'email') {
            server_errors['non_field_errors'] = messages[key][0];
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
      <NativeUiHeader subScreen={true} sectionTitle={'Forget Password'} />
      <NativeUiModal
        navigation={navigation}
        visible={visible}
        setVisible={setVisible}
        description={
          'We just sent a password reset link to your email! Check your mail!'
        }
        navigateTo={'Home'}
        label={'Go to Home'}
      />
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
        {error.length > 0 && <ErrorCard error={error} />}
      </View>

      <View style={styles.container}>
        <View style={[styles.introContainer, styles.topContainer]}>
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
                <View style={styles.input}>
                  <NativeUiInput
                    label={'Enter your email'}
                    placeholder={' Email'}
                    onChangeText={(e) => {
                      setFieldValue('email', e);
                      setFieldTouched('email', true, false);
                      changeText(e, 'email');
                    }}
                    onBlur={handleBlur('email')}
                    error={touched.email && errors.email}
                  />
                </View>
              );
            }}
          </Formik>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        {!loading ? (
          <NativeUiButton label={'Send reset link'} onPress={onResetClick} />
        ) : (
          <NativeUiActivityIndicator />
        )}
      </View>
    </View>
  );
};

export default ForgetPassword;
