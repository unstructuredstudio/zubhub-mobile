import React, { useState, useRef } from 'react';
import {
  View,
  FlatList,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import styles from './Onboarding.style';
import { ONBOARD_DATA } from '../../data';
import { Feather } from '@expo/vector-icons';
import { NativeUiText } from '@components/';
import * as THEME from '../../constants/theme';

const WIDTH = Dimensions.get('screen').width;

const Onboarding = ({ navigation }) => {
  const ref = useRef(null);
  const [currentElemIndex, setCurrentElemIndex] = useState(0);

  const updateCurrentSlideIndex = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / WIDTH);
    setCurrentElemIndex(currentIndex);
  };

  const goToNextSlide = () => {
    const nextSlideIndex = currentElemIndex + 1;
    if (currentElemIndex === ONBOARD_DATA.length - 1) {
      navigation.replace('Home');
    } else {
      if (nextSlideIndex != ONBOARD_DATA.length) {
        const offset = nextSlideIndex * WIDTH;
        ref?.current?.scrollToOffset({ offset });
        setCurrentElemIndex(nextSlideIndex);
      }
    }
  };

  const goToPrevSlide = () => {
    const prevSlideIndex = currentElemIndex - 1;
    if (prevSlideIndex != ONBOARD_DATA.length) {
      const offset = prevSlideIndex * WIDTH;
      ref?.current?.scrollToOffset({ offset });
      setCurrentElemIndex(prevSlideIndex);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle={'dark-content'} />

      {currentElemIndex === ONBOARD_DATA.length - 1 && (
        <TouchableOpacity
          onPress={() => navigation.replace('Home')}
          style={styles.skip}
        >
          <NativeUiText
            textType="medium"
            style={[
              styles.skipColor,
              currentElemIndex === ONBOARD_DATA.length - 1
                ? styles.isLast
                : styles.diff,
            ]}
          >
            GET STARTED
          </NativeUiText>
        </TouchableOpacity>
      )}
      <FlatList
        ref={ref}
        contentContainerStyle={styles.cont}
        keyExtractor={(_, index) => index}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        onMomentumScrollEnd={updateCurrentSlideIndex}
        data={ONBOARD_DATA}
        renderItem={({ item }) => (
          <View style={styles.main}>
            <View style={styles.annimView}>
              <Image style={styles.img} source={item.image} />
            </View>
            <View>
              <NativeUiText
                textType="medium"
                fontSize={24}
                style={styles.heading}
              >
                {item.title}{' '}
              </NativeUiText>
              <NativeUiText
                textColor={THEME.COLORS.SECONDARY_TEXT}
                style={styles.body}
                fontSize={16}
              >
                {item.desc}
              </NativeUiText>
            </View>
          </View>
        )}
      />

      <FooterComponent
        goToNextSlide={goToNextSlide}
        goToPrevSlide={goToPrevSlide}
        currentElemIndex={currentElemIndex}
      />
    </View>
  );
};

export default Onboarding;

const FooterComponent = ({
  currentElemIndex,
  goToNextSlide,
  goToPrevSlide,
}) => {
  return (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.iconView} onPress={goToPrevSlide}>
        <Feather
          name="arrow-left"
          size={22}
          color={THEME.COLORS.PRIMARY_TEAL}
        />
      </TouchableOpacity>
      <View style={styles.indicatorView}>
        {ONBOARD_DATA.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              currentElemIndex === index && {
                backgroundColor: THEME.COLORS.PRIMARY_TEAL,
                width: 40,
              },
            ]}
          ></View>
        ))}
      </View>
      <TouchableOpacity
        onPress={goToNextSlide}
        style={[styles.iconView, styles.rightIcon]}
      >
        <Feather name="arrow-right" size={22} color={THEME.COLORS.WHITE} />
      </TouchableOpacity>
    </View>
  );
};
