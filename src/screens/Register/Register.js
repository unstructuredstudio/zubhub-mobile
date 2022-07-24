import { View, ScrollView, FlatList, Pressable } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiInput,
  NativeUiButton,
} from '@components/';
import * as THEME from '../../constants/theme';
import styles from './Register.style';
import DefaultStyles from '../../constants/DefaultStyles.style';
import Entypo from 'react-native-vector-icons/Entypo';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useNavigation } from '@react-navigation/native';

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
  return (
    <>
      <ScrollView style={styles.container}>
        <View style={[styles.introContainer, styles.topContainer]}>
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
        </View>
      </ScrollView>
    </>
  );
};

const LayoutTwo = () => {
  return (
    <>
      <ScrollView style={styles.container}>
        <View style={[styles.introContainer]}>
          <View style={styles.input}>
            <NativeUiInput
              label={'Provide your location'}
              placeholder={'Location'}
            />
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
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
};
