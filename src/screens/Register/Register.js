import {
  View,
  ScrollView,
  FlatList,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiInput,
  NativeUiButton,
  NativeUiSelect,
} from '@components/';
import * as THEME from '../../constants/theme';
import styles from './Register.style';
import DefaultStyles from '../../constants/DefaultStyles.style';
import Entypo from 'react-native-vector-icons/Entypo';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import CountryPicker from 'react-native-country-picker-modal';
import PhoneInput from 'react-native-phone-number-input';

const initialValues = {
  username: '',
  location: '',
  dob: '',
  phone: '',
  email: '',
  password1: '',
  password2: '',
  bio: '',
};

const validationSchema = Yup.object({
  username: Yup.string().trim().required('We need your username to proceed'),
  location: Yup.string()
    .trim()
    .required('Looks like you forgot this! Where are you from? '),
  dob: Yup.string().trim().required('Looks like you forgot to enter this!'),
  phone: Yup.string()
    .trim()
    .required('You must enter either an email or a phone number'),
  email: Yup.string()
    .trim()
    .required('You must enter either an email or a phone number'),
  password1: Yup.string().trim().min(8, 'Provide a strong password here'),
  password2: Yup.string().equals(
    [Yup.ref('password1'), null],
    'Password does not match!'
  ),
});

const Register = () => {
  const navigation = useNavigation();

  const ref = useRef(null);
  const [currentElemIndex, setCurrentElemIndex] = useState(0);
  const [componentsArray, setComponentsArray] = useState([]);

  useEffect(() => {
    setComponentsArray([<LayoutOne />, <LayoutTwo />, <LayoutThree />]);
  }, []);

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

  return (
    <View style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={'Register'} />

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

        <View style={[DefaultStyles.containerSpaced, styles.wizard]}>
          <View style={[styles.box]}>
            <View style={[DefaultStyles.containerRow]}>
              <RNBounceable
                onPress={() => goToPrevSlide(0)}
                style={[styles.circle, DefaultStyles.containerCenter]}
              >
                <Entypo name="check" size={25} color={THEME.COLORS.WHITE} />
              </RNBounceable>
              <View style={styles.line} />
            </View>
            <NativeUiText style={styles.step}>Step 1</NativeUiText>
          </View>

          <View style={styles.box}>
            <View style={[DefaultStyles.containerRow]}>
              <RNBounceable
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
              </RNBounceable>
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
              style={styles.step}
            >
              Step 2
            </NativeUiText>
          </View>

          <View style={[styles.box]}>
            <View style={[DefaultStyles.containerRow]}>
              <RNBounceable
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
              </RNBounceable>
            </View>
            <NativeUiText
              textColor={
                currentElemIndex === 2
                  ? THEME.COLORS.PRIMARY_GREEN
                  : THEME.COLORS.PRIMARY_BLUE
              }
              style={styles.step}
            >
              Step 3
            </NativeUiText>
          </View>
        </View>
      </View>

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
      <View style={styles.bottomContainer}>
        <NativeUiButton
          label={
            currentElemIndex === componentsArray.length - 1
              ? 'Create Account'
              : 'Next'
          }
          onPress={() =>
            currentElemIndex === componentsArray.length - 1
              ? navigation.navigate('BottomNavigator')
              : goToNextSlide()
          }
        />
        <Pressable onPress={() => navigation.navigate('Login')}>
          <NativeUiText textType="medium" style={styles.member}>
            Already a member ?
            <NativeUiText
              textColor={THEME.COLORS.PRIMARY_TEAL}
              textType={'medium'}
            >
              {' '}
              Login
            </NativeUiText>
          </NativeUiText>
        </Pressable>
      </View>
    </View>
  );
};

export default Register;

const LayoutOne = () => {
  const [value, setValue] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const [valid, setValid] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const phoneInput = useRef(null);

  return (
    <>
      <ScrollView style={styles.container}>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
        >
          {({ values, handleChange, errors, touched, handleBlur }) => {
            console.log(values);

            return (
              <View style={[styles.introContainer, styles.topContainer]}>
                <View style={styles.input}>
                  <NativeUiInput
                    label={'Username'}
                    placeholder={'Username'}
                    onChangeText={handleChange('username')}
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
                    Enter phone number
                  </NativeUiText>
                  <PhoneInput
                    containerStyle={[styles.inputContainer, styles.dropdown]}
                    ref={phoneInput}
                    defaultValue={value}
                    defaultCode="DM"
                    layout="first"
                    onChangeText={(text) => {
                      setValue(text);
                    }}
                    onChangeFormattedText={(text) => {
                      setFormattedValue(text);
                    }}
                    withShadow
                    autoFocus
                  />
                  {/* <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                      const checkValid =
                        phoneInput.current?.isValidNumber(value);
                      setShowMessage(true);
                      setValid(checkValid ? checkValid : false);
                    }}
                  >
                    <NativeUiText>Check</NativeUiText>
                  </TouchableOpacity> */}
                </View>
                <View style={styles.input}>
                  <NativeUiInput
                    label={'Enter your email'}
                    placeholder={'Email'}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    error={touched.email && errors.email}
                  />
                </View>

                <View style={styles.input}>
                  <NativeUiInput
                    label={'Enter your password'}
                    placeholder={'Password'}
                    onChangeText={handleChange('password1')}
                    onBlur={handleBlur('password1')}
                    error={touched.password1 && errors.password1}
                  />
                </View>
                <View style={styles.input}>
                  <NativeUiInput
                    label={'Confirm your password'}
                    placeholder={'Password'}
                    onChangeText={handleChange('password2')}
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

const LayoutTwo = () => {
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
  };
  return (
    <>
      <ScrollView style={styles.container}>
        <View style={[styles.introContainer]}>
          <NativeUiText style={styles.location} textType="medium">
            Please provide your location
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

const LayoutThree = () => {
  return (
    <>
      <ScrollView style={styles.container}>
        <View style={[styles.introContainer]}>
          <View style={styles.input}>
            <NativeUiInput
              label={'Tell us about yourself'}
              placeholder={'Bio'}
              multiline
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
};
