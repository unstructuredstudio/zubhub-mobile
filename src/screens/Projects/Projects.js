import { View, ScrollView, FlatList, Pressable } from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiInput,
  NativeUiButton,
} from '@components/';
import * as THEME from '../../constants/theme';
import styles from './Projects.style';
import DefaultStyles from '../../constants/DefaultStyles.style';
import layout from '../../constants/layout';
import Entypo from 'react-native-vector-icons/Entypo';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useNavigation } from '@react-navigation/native';

const Projects = () => {
  const navigation = useNavigation();

  const ref = useRef(null);
  const [currentElemIndex, setCurrentElemIndex] = useState(0);
  const [componentsArray, setComponentsArray] = useState([]);

  useEffect(() => {
    setComponentsArray([<LayoutOne />, <LayoutTwo />, <LayoutThree />]);
  }, []);

  const updateCurrentSlideIndex = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / layout.window.width);
    setCurrentElemIndex(currentIndex);
  };

  const goToNextSlide = () => {
    const nextSlideIndex = currentElemIndex + 1;
    if (currentElemIndex === componentsArray.length - 1) {
      navigation.replace('Auth');
    } else {
      if (nextSlideIndex != componentsArray.length) {
        const offset = nextSlideIndex * layout.window.width;
        ref?.current?.scrollToOffset({ offset });
        setCurrentElemIndex(nextSlideIndex);
      }
    }
  };

  const goToPrevSlide = (index) => {
    // const prevSlideIndex = currentElemIndex - 1;
    if (index != componentsArray.length) {
      const offset = index * layout.window.width;
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
              width: layout.window.width * 1,
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
              ? 'Create Project'
              : 'Next'
          }
          onPress={() => goToNextSlide()}
        />
      </View>
    </View>
  );
};

export default Projects;

const LayoutOne = () => {
  return (
    <>
      <ScrollView style={styles.container}>
        <View style={[styles.introContainer, styles.topContainer]}>
          <View style={styles.input}>
            <NativeUiInput
              label={'Name your project'}
              placeholder={'Project name'}
            />
          </View>
          <View style={styles.input}>
            <NativeUiInput
              label={'Describe what it is'}
              placeholder={'Describe your project...'}
              multiline={true}
              bottomText={
                'Tell us something interesting about the project! You can share what it is about, what inspired you to make it, your making process, fun and challenging moments you experienced, etc.'
              }
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
        <View style={[styles.introContainer, styles.topContainer]}>
          <View>
            <View style={styles.input}>
              <View>
                <NativeUiText textType="medium">
                  Lets add some pictures
                </NativeUiText>
                <NativeUiText
                  fontSize={12}
                  textColor={THEME.COLORS.SECONDARY_TEXT}
                  style={styles.details}
                >
                  Dont have them? Add a video instead!
                </NativeUiText>

                <View
                  style={[DefaultStyles.containerRow, styles.imageContainer]}
                >
                  <Entypo
                    name="folder-images"
                    size={24}
                    color={THEME.COLORS.PRIMARY_TEAL}
                  />
                  <NativeUiText
                    textColor={THEME.COLORS.PRIMARY_TEAL}
                    textType={'medium'}
                    style={styles.txt}
                  >
                    ADD IMAGES
                  </NativeUiText>
                </View>
              </View>
            </View>
            <View style={styles.input}>
              <View>
                <NativeUiText textType="medium">Lets add a video</NativeUiText>
                <NativeUiText
                  fontSize={12}
                  textColor={THEME.COLORS.SECONDARY_TEXT}
                  style={styles.details}
                >
                  Its ok if you dont have a videa, you can add images
                </NativeUiText>

                <View
                  style={[DefaultStyles.containerRow, styles.imageContainer]}
                >
                  <Entypo
                    name="folder-images"
                    size={24}
                    color={THEME.COLORS.PRIMARY_TEAL}
                  />
                  <NativeUiText
                    textColor={THEME.COLORS.PRIMARY_TEAL}
                    textType={'medium'}
                    style={styles.txt}
                  >
                    ADD VIDEO
                  </NativeUiText>
                </View>
              </View>
            </View>

            <View>
              <View style={styles.input}>
                <NativeUiText textType="medium" style={styles.materialsText}>
                  What materials did you use
                </NativeUiText>
                <View style={styles.materialInput}>
                  <NativeUiInput />
                </View>
                <View style={styles.materialInput}>
                  <NativeUiInput />
                </View>
                <View style={styles.materialInput}>
                  <NativeUiInput />
                </View>
              </View>

              <View>
                <View style={[DefaultStyles.containerRow, styles.addMore]}>
                  <Entypo
                    name="folder-images"
                    size={24}
                    color={THEME.COLORS.PRIMARY_TEAL}
                  />
                  <NativeUiText
                    textColor={THEME.COLORS.PRIMARY_TEAL}
                    textType={'medium'}
                    style={styles.txt}
                  >
                    ADD MORE
                  </NativeUiText>
                </View>
              </View>
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
              label={'What tag best describe your project'}
              placeholder={'Add a tag...'}
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
};
