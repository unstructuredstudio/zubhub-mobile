import { View, ScrollView, FlatList, Pressable } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiInput,
  NativeUiButton,
  NativeUiModal,
  ErrorCard,
  NativeUiActivityIndicator,
  NativeKeyboardAvoidingView,
} from '@components/';
import * as THEME from '../../constants/theme';
import styles from './Register.style';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import CountryPicker from 'react-native-country-picker-modal';
import PhoneInput from 'react-native-phone-number-input';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { EvilIcons, Entypo } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../redux/actions/authAction';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

const initialValues = {
  username: '',
  email: '',
  password1: '',
  password2: '',
};

const validationSchema = Yup.object({
  username: Yup.string().trim().required('general.usernameBlank'),
  location: Yup.string().trim().required('register.locationBlank'),
  dob: Yup.string().trim().required('general.seemsLikeYouForgot'),
  phone: Yup.string().trim().required('general.register'),
  email: Yup.string().trim().required('general.register'),
  password1: Yup.string().trim().min(8, 'general.strongPassword'),
  password2: Yup.string().equals(
    [Yup.ref('password1'), null],
    'register.passwordDontMatch!'
  ),
});

const Register = () => {
  const { t } = useTranslation();

  const navigation = useNavigation();
  const dispatch = useDispatch();

  const ref = useRef(null);

  const [currentElemIndex, setCurrentElemIndex] = useState(0);
  const [userData, setUserData] = useState({
    username: '',
    phone: '',
    email: '',
    password1: '',
    password2: '',
    bio: '',
    dateOfBirth: '',
    location: 'France',
  });

  const [visible, setVisible] = useState(false);
  const [error, setError] = useState([]);
  const [loading, setLoading] = useState(false);
  const componentsArray = [
    <LayoutOne t={t} userData={userData} setUserData={setUserData} />,
    <LayoutTwo t={t} userData={userData} setUserData={setUserData} />,
    <LayoutThree
      t={t}
      setError={setError}
      error={error}
      userData={userData}
      setUserData={setUserData}
    />,
  ];

  const updateCurrentSlideIndex = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / THEME.WIDTH);
    setCurrentElemIndex(currentIndex);
  };

  const goToNextSlide = () => {
    const nextSlideIndex = currentElemIndex + 1;
    if (currentElemIndex === componentsArray.length - 1) {
      navigation.replace('BottomNavigator');
    } else {
      if (nextSlideIndex != componentsArray.length) {
        const offset = nextSlideIndex * THEME.WIDTH;
        ref?.current?.scrollToOffset({ offset });
        setCurrentElemIndex(nextSlideIndex);
      }
    }
  };

  const goToPrevSlide = (index) => {
    if (index != componentsArray.length) {
      const offset = index * THEME.WIDTH;
      ref?.current?.scrollToOffset({ offset });
      setCurrentElemIndex(index);
    }
  };

  const onRegister = () => {
    setLoading(true);
    const server_errors = {};
    let err = [];
    Object.entries(userData).map((element) => {
      if (
        element[1] === '' &&
        element[0] !== 'email' &&
        element[0] !== 'phone' &&
        element[0] !== 'bio'
      ) {
        err.push(` ${element[0]} ${t('general.requiredToProceed')}`);
      }
    });

    if (err.length > 0) {
      setLoading(false);
      return setError(err);
    }

    let result = dispatch(registerUser(userData, setVisible, setLoading));
    result.catch((error) => {
      setLoading(false);
      let messages = JSON.parse(error.message);

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
    });
  };

  const submit = () => {
    if (currentElemIndex === componentsArray.length - 1) {
      onRegister();
    } else {
      goToNextSlide();
    }
  };

  return (
    <View style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={t('general.register')} />
      <NativeUiModal
        navigation={navigation}
        visible={visible}
        setVisible={setVisible}
        description={t('register.accountCreationSuccess')}
        navigateTo={'BottomNavigator'}
        label={'general.goToHome'}
      />
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

        <View style={[DefaultStyles.containerSpaced, styles.wizard]}>
          <View style={[styles.box]}>
            <View style={[DefaultStyles.containerRow]}>
              <TouchableOpacity
                onPress={() => goToPrevSlide(0)}
                style={[styles.circle, DefaultStyles.containerCenter]}
              >
                <Entypo name="check" size={25} color={THEME.COLORS.WHITE} />
              </TouchableOpacity>
              <View style={styles.line} />
            </View>
            <NativeUiText fontSize={12} style={styles.step}>
              {t('general.step1')}
            </NativeUiText>
          </View>

          <View style={styles.box}>
            <View style={[DefaultStyles.containerRow]}>
              <TouchableOpacity
                onPress={() => goToPrevSlide(1)}
                style={[
                  styles.circle,
                  DefaultStyles.containerCenter,
                  {
                    backgroundColor:
                      currentElemIndex === 1 || currentElemIndex === 2
                        ? THEME.COLORS.PRIMARY_GREEN
                        : THEME.COLORS.PRIMARY_BLUE,
                  },
                ]}
              >
                {(currentElemIndex === 1 || currentElemIndex === 2) && (
                  <Entypo name="check" size={25} color={THEME.COLORS.WHITE} />
                )}
              </TouchableOpacity>
              <View
                style={[
                  styles.line,
                  {
                    backgroundColor:
                      currentElemIndex === 2
                        ? THEME.COLORS.PRIMARY_GREEN
                        : THEME.COLORS.PRIMARY_BLUE,
                  },
                ]}
              />
            </View>

            <NativeUiText
              textColor={
                currentElemIndex === 1 || currentElemIndex === 2
                  ? THEME.COLORS.PRIMARY_GREEN
                  : THEME.COLORS.PRIMARY_BLUE
              }
              fontSize={12}
              style={styles.step}
            >
              {t('general.step2')}
            </NativeUiText>
          </View>

          <View style={[styles.box]}>
            <View style={[DefaultStyles.containerRow]}>
              <TouchableOpacity
                onPress={() => goToPrevSlide(2)}
                style={[
                  styles.circle,
                  DefaultStyles.containerCenter,
                  {
                    backgroundColor:
                      currentElemIndex === 2
                        ? THEME.COLORS.PRIMARY_GREEN
                        : THEME.COLORS.PRIMARY_BLUE,
                  },
                ]}
              >
                {currentElemIndex === 2 && (
                  <Entypo name="check" size={25} color={THEME.COLORS.WHITE} />
                )}
              </TouchableOpacity>
            </View>
            <NativeUiText
              textColor={
                currentElemIndex === 2
                  ? THEME.COLORS.PRIMARY_GREEN
                  : THEME.COLORS.PRIMARY_BLUE
              }
              fontSize={12}
              style={styles.step}
            >
              {t('general.step3')}
            </NativeUiText>
          </View>
        </View>
      </View>

      <NativeKeyboardAvoidingView>
        <FlatList
          ref={ref}
          keyExtractor={(_, index) => index}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          onMomentumScrollEnd={updateCurrentSlideIndex}
          data={componentsArray}
          renderItem={({ item }) => (
            <View
              style={{
                width: THEME.WIDTH * 1,
                paddingHorizontal: 12,
              }}
            >
              {item}
            </View>
          )}
        />
      </NativeKeyboardAvoidingView>
      <View style={styles.bottomContainer}>
        {!loading ? (
          <NativeUiButton
            label={
              currentElemIndex === componentsArray.length - 1
                ? t('register.createAccount')
                : t('general.next')
            }
            onPress={submit}
          />
        ) : (
          <NativeUiActivityIndicator />
        )}
        <Pressable onPress={() => navigation.navigate('Login')}>
          <NativeUiText textType="medium" style={styles.member}>
            {t('register.alreadyAMember')} ?
            <NativeUiText
              textColor={THEME.COLORS.PRIMARY_TEAL}
              textType={'medium'}
            >
              {' '}
              {t('general.login')}
            </NativeUiText>
          </NativeUiText>
        </Pressable>
      </View>
    </View>
  );
};

export default Register;

const LayoutOne = ({ userData, setUserData, t }) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [value, setValue] = useState('');

  const phoneInput = useRef(null);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  useEffect(() => {
    setUserData({
      ...userData,
      dateOfBirth: dateOfBirth,
    });
  }, [dateOfBirth]);

  const handleConfirm = (date) => {
    changeText(date.toLocaleDateString('sv-SE'), 'dateOfBirth');
    setDateOfBirth(date.toLocaleDateString('sv-SE'));

    hideDatePicker();
  };

  const changeText = (e, key) => {
    const data = { ...userData };
    data[key] = e;
    setUserData(data);
  };
  return (
    <>
      <ScrollView style={styles.container}>
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
              <View style={[styles.introContainer, styles.topContainer]}>
                <View style={styles.input}>
                  <NativeUiInput
                    label={t('general.username')}
                    placeholder={t('general.username')}
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
                  {/* {showMessage && (
                    <View style={styles.message}>
                      <NativeUiText>Value : {value}</NativeUiText>
                      <NativeUiText>
                        Formatted Value : {formattedValue}
                      </NativeUiText>
                      <NativeUiText>
                        Valid : {valid ? 'true' : 'false'}
                      </NativeUiText>
                    </View>
                  )} */}
                  <NativeUiText textType="medium" style={styles.location}>
                    {t('register.enterPhoneNumber')}
                  </NativeUiText>
                  <PhoneInput
                    containerStyle={[styles.inputContainer, styles.dropdown]}
                    ref={phoneInput}
                    defaultCode="CM"
                    layout="first"
                    onChangeText={(text) => {
                      setValue(text);
                    }}
                    onChangeFormattedText={(text) => {
                      changeText(text, 'phone');
                    }}
                    withShadow
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.button}
                    // onPress={() => {
                    //   const checkValid =
                    //     phoneInput.current?.isValidNumber(value);
                    //   setShowMessage(true);
                    //   setValid(checkValid ? checkValid : false);
                    // }}
                  >
                    <NativeUiText>Check</NativeUiText>
                  </TouchableOpacity>
                </View>
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

                <View style={styles.input}>
                  <NativeUiText textType="medium" style={styles.location}>
                    {t('register.dateOfBirth')}
                  </NativeUiText>
                  <View style={[styles.inputContainer]}>
                    <View style={styles.container}>
                      <NativeUiText>
                        {dateOfBirth ? dateOfBirth : t('register.selectADate')}
                      </NativeUiText>
                    </View>
                    <Pressable
                      onPress={showDatePicker}
                      style={[DefaultStyles.containerCenter, styles.arrow]}
                    >
                      <EvilIcons name="calendar" size={30} color="black" />
                    </Pressable>
                  </View>
                  <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirm}
                    onCancel={hideDatePicker}
                  />
                </View>

                <View style={styles.input}>
                  <NativeUiInput
                    password
                    label={t('general.enterPassword')}
                    placeholder={t('general.password')}
                    onChangeText={(e) => {
                      setFieldValue('password1', e);
                      setFieldTouched('password1', true, false);
                      changeText(e, 'password1');
                    }}
                    onBlur={handleBlur('password1')}
                    error={touched.password1 && errors.password1}
                  />
                </View>
                <View style={styles.input}>
                  <NativeUiInput
                    password
                    label={t('general.confirmPassword')}
                    placeholder={t('general.password')}
                    onChangeText={(e) => {
                      setFieldValue('password2', e);
                      setFieldTouched('password2', true, false);
                      changeText(e, 'password2');
                    }}
                    onBlur={handleBlur('password2')}
                    error={touched.password2 && errors.password2}
                  />
                </View>
              </View>
            );
          }}
        </Formik>
      </ScrollView>
    </>
  );
};

const LayoutTwo = ({ userData, setUserData, t }) => {
  const [countryCode, setCountryCode] = useState('FR');
  const [country, setCountry] = useState(null);
  const [withCountryNameButton, setWithCountryNameButton] = useState(true);
  const [withFlag, setWithFlag] = useState(true);
  const [withEmoji, setWithEmoji] = useState(true);
  const [withFilter, setWithFilter] = useState(true);
  const [withAlphaFilter, setWithAlphaFilter] = useState(false);
  const [withCallingCode, setWithCallingCode] = useState(false);

  const onSelect = (country) => {
    setCountryCode(country.cca2);
    setCountry(country);
    setUserData({
      ...userData,
      location: country?.name,
    });
  };
  useEffect(() => {
    // setUserData({
    //   ...userData,
    //   location: country?.name,
    // });
  }, [country]);
  return (
    <>
      <ScrollView style={styles.container}>
        <View style={[styles.introContainer]}>
          <NativeUiText style={styles.location} textType="medium">
            {t('register.provideLocation')}
          </NativeUiText>
          <View style={[styles.inputContainer]}>
            <View style={styles.container}>
              <CountryPicker
                containerButtonStyle={styles.dropdown}
                {...{
                  countryCode,
                  withFilter,
                  withFlag,
                  withCountryNameButton,
                  withAlphaFilter,
                  withCallingCode,
                  withEmoji,
                  onSelect,
                }}
                // visible
              />
            </View>
            <View style={[DefaultStyles.containerCenter, styles.arrow]}>
              <Entypo name="chevron-down" size={22} color="black" />
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const LayoutThree = ({ userData, setUserData, error, setError, t }) => {
  return (
    <>
      <ScrollView style={styles.container}>
        {error.length > 0 && <ErrorCard error={error} setError={setError} />}
        <View style={[styles.introContainer]}>
          <View style={styles.input}>
            <NativeUiInput
              label={t('register.tellUsAboutYou')}
              placeholder={t('register.bio')}
              multiline
              onChangeText={(txt) => setUserData({ ...userData, bio: txt })}
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
};
