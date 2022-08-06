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
import { NativeUiButton, NativeUiText } from '@components/';
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

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle={'dark-content'} />

      <FlatList
        ref={ref}
        keyExtractor={(_, index) => index}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        onMomentumScrollEnd={updateCurrentSlideIndex}
        data={ONBOARD_DATA}
        renderItem={({ item }) => (
          <View style={styles.main}>
            <View style={styles.imgConainer}>
              <Image style={styles.img} source={require('@asset/logo.png')} />
            </View>
            <View>
              <NativeUiText
                textType="medium"
                fontSize={30}
                style={styles.heading}
                textColor={THEME.COLORS.WHITE}
              >
                {item.title}{' '}
              </NativeUiText>
              <NativeUiText
                textColor={THEME.COLORS.WHITE}
                style={styles.body}
                fontSize={18}
              >
                {item.desc}
              </NativeUiText>
            </View>
          </View>
        )}
      />

      <FooterComponent
        goToNextSlide={goToNextSlide}
        currentElemIndex={currentElemIndex}
      />
    </View>
  );
};

export default Onboarding;

const FooterComponent = ({ currentElemIndex, goToNextSlide }) => {
  return (
    <View style={styles.footer}>
      <NativeUiButton
        onPress={goToNextSlide}
        label={
          currentElemIndex === ONBOARD_DATA.length - 1 ? 'Get Started' : 'Next'
        }
      />
    </View>
  );
};
