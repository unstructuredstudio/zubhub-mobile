import { View, ScrollView } from 'react-native';
import React, { useState } from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiInput,
  NativeUiButton,
  ErrorCard,
  NativeUiModal,
  NativeUiActivityIndicator,
  NativeKeyboardAvoidingView,
} from '@components/';
import * as THEME from '../../constants/theme';
import styles from './ForgetPassword.style';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { resetPassordLink } from '../../redux/actions/authAction';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

const initialValues = {
  email: '',
};

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('forgetPassword.invalidEmail')
    .required('general.fillAllFields'),
});

const ForgetPassword = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t } = useTranslation();

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
      err.push(t('general.fillAllFields'));
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
        setError(Object.values([t('general.smagError')]));
      }
    });
  };

  return (
    <View style={styles.container}>
      <NativeUiHeader
        subScreen={true}
        sectionTitle={t('general.forgetPassword')}
      />
      <NativeKeyboardAvoidingView>
        <ScrollView>
          <NativeUiModal
            navigation={navigation}
            visible={visible}
            setVisible={setVisible}
            description={t('forgetPassword.invalidEmail')}
            navigateTo={'Home'}
            label={t('general.goToHome')}
          />
          <View style={styles.topContainer}>
            <View style={[styles.introContainer]}>
              <NativeUiText
                fontSize={THEME.FONT_SIZE.LARGE}
                textType={'medium'}
              >
                {t('forgetPassword.passwordReset')}
              </NativeUiText>
              <NativeUiText
                style={styles.createAccount}
                textColor={THEME.COLORS.SECONDARY_TEXT}
                textType={'medium'}
              >
                {t('forgetPassword.enterEmailMessage')}
              </NativeUiText>
            </View>
            {error.length > 0 && (
              <ErrorCard setError={setError} error={error} />
            )}
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
                        label={t('general.enterEmail')}
                        placeholder={t('general.email')}
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
              <NativeUiButton
                label={t('forgetPassword.sendResetLink')}
                onPress={onResetClick}
              />
            ) : (
              <NativeUiActivityIndicator />
            )}
          </View>
        </ScrollView>
      </NativeKeyboardAvoidingView>
    </View>
  );
};

export default ForgetPassword;
