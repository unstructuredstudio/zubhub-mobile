import { AssetsSelector } from 'expo-images-picker';
import {
  View,
  ScrollView,
  FlatList,
  Pressable,
  TouchableOpacity,
  Image,
} from 'react-native';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiInput,
  NativeUiButton,
  NativeUiSelect,
} from '@components/';
import * as THEME from '../../constants/theme';
import styles from './Projects.style';
import DefaultStyles from '../../constants/DefaultStyles.style';
import layout from '../../constants/layout';
import Entypo from 'react-native-vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import { UploadToLocal } from '../../redux/actions/projectsAction';
import { useDispatch, useSelector } from 'react-redux';

const initialValues = {
  title: '',
  description: '',
  images: [
    {
      image_url: '',
      public_id: '',
    },
  ],
  video: '',
  materials_used: '',
  category: '',
};

const Projects = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  const ref = useRef(null);
  const [currentElemIndex, setCurrentElemIndex] = useState(0);
  const [componentsArray, setComponentsArray] = useState([]);
  const [imagesDataSet, setImagesDataSet] = useState([]);
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    images: [
      {
        image_url: '',
        public_id: '',
      },
    ],
    video: '',
    materials_used: '',
    category: '',
  });

  useEffect(() => {
    setComponentsArray([
      <LayoutOne projectData={projectData} setProjectData={setProjectData} />,
      <LayoutTwo
        projectData={projectData}
        setImagesDataSet={setImagesDataSet}
        setProjectData={setProjectData}
      />,
      <LayoutThree projectData={projectData} setProjectData={setProjectData} />,
    ]);
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
    if (index != componentsArray.length) {
      const offset = index * layout.window.width;
      ref?.current?.scrollToOffset({ offset });
      setCurrentElemIndex(index);
    }
  };

  const onCreateProject = () => {
    console.log(imagesDataSet, 'img');
    dispatch(
      UploadToLocal({
        t: [imagesDataSet[0].uri],
        token: user?.token,
      })
    );
  };

  return (
    <View style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={'Create Project'} />

      <View style={styles.topContainer}>
        <View style={[styles.introContainer]}>
          <NativeUiText fontSize={THEME.FONT_SIZE.LARGE} textType={'medium'}>
            Create project
          </NativeUiText>
          <NativeUiText
            style={styles.createAccount}
            textColor={THEME.COLORS.SECONDARY_TEXT}
            textType={'medium'}
          >
            Tell us about your project!
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
            <NativeUiText style={styles.step}>Step 1</NativeUiText>
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
              style={styles.step}
            >
              Step 2
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
          onPress={() =>
            currentElemIndex === componentsArray.length - 1
              ? onCreateProject()
              : goToNextSlide()
          }
        />
      </View>
    </View>
  );
};

export default Projects;

const LayoutOne = ({ projectData, setProjectData }) => {
  return (
    <>
      <ScrollView style={styles.container}>
        <View style={[styles.introContainer, styles.topContainer]}>
          <View style={styles.input}>
            <NativeUiInput
              label={'Name your project'}
              placeholder={'Project name'}
              onChangeText={(name) =>
                setProjectData({ ...projectData, name: name })
              }
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
              onChangeText={(description) =>
                setProjectData({ ...projectData, description: description })
              }
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const LayoutTwo = ({ projectData, setProjectData, setImagesDataSet }) => {
  const [visible, setVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [materialUsedArray, setMaterialUsedArray] = useState([
    {
      value: '',
    },
    {
      value: '',
    },
    {
      value: '',
    },
  ]);

  const widgetSettings = useMemo(
    () => ({
      getImageMetaData: false,
      initialLoad: 100,
      // assetsType: [MediaType.photo, MediaType.video],
      minSelection: 1,
      maxSelection: 10,
      portraitCols: 3,
      landscapeCols: 3,
    }),
    []
  );

  const widgetErrors = useMemo(
    () => ({
      errorTextColor: 'polar_text_2',
      errorMessages: {
        hasErrorWithPermissions: 'translator(T.ERROR.HAS_PERMISSIONS_ERROR)',
        hasErrorWithLoading: ' translator(T.ERROR.HAS_INTERNAL_ERROR)',
        hasErrorWithResizing: ' eee translator(T.ERROR.HAS_INTERNAL_ERROR)',
        hasNoAssets: ' translator(T.ERROR.HAS_NO_ASSETS)',
      },
    }),
    []
  );

  const widgetNavigator = useMemo(
    () => ({
      Texts: {
        finish: 'finish',
        back: 'back',
        selected: 'selected',
      },
      midTextColor: 'polar_text_2',
      minSelection: 1,
      onBack: () => setVisible(false),
      onSuccess: (data) => {
        setImagesDataSet(data);
        setVisible(false);
      },
    }),
    []
  );

  const widgetResize = useMemo(
    () => ({
      width: 512,
      compress: 0.7,
      base64: false,
      saveTo: 'jpg',
    }),
    []
  );

  const widgetStyles = useMemo(
    () => ({
      margin: 2,

      widgetWidth: 99,
      screenStyle: {
        borderRadius: 5,
        overflow: 'hidden',
      },
      widgetStyle: {
        margin: 10,
      },
      videoIcon: {
        Component: Ionicons,
        iconName: 'ios-videocam',
        // color: polar_text_1,
        size: 20,
      },
      selectedIcon: {
        Component: Ionicons,
        iconName: 'ios-checkmark-circle-outline',
        color: 'white',
        // bg: mainWithOpacity,
        size: 26,
      },
    }),
    []
  );

  const onChangeText = (index, txt) => {
    let arr = materialUsedArray;
    arr[index] = { value: txt };
    setMaterialUsedArray(arr);
    // console.log(materialUsedArray, 'ma');
  };
  // useEffect(() => {}, [materialUsedArray]);

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

                <TouchableOpacity
                  onPress={() => setVisible(true)}
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
                </TouchableOpacity>
                <Modal
                  onBackdropPress={() => setVisible(false)}
                  isVisible={visible}
                  backdropColor={'white'}
                  backdropOpacity={1}
                >
                  <Pressable onPress={() => setVisible(false)}></Pressable>
                  <View
                    style={{
                      flex: 1,
                      marginTop: 23,
                    }}
                  >
                    <AssetsSelector
                      Settings={widgetSettings}
                      Errors={widgetErrors}
                      Styles={widgetStyles}
                      Resize={widgetResize}
                      Navigator={widgetNavigator}
                      CustomNavigator={{
                        props: {
                          backFunction: true,
                        },
                      }}
                    />
                  </View>
                </Modal>
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
                  Its ok if you dont have a video, you can add images
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
                {materialUsedArray.map((item, index) => (
                  <View style={styles.materialInput}>
                    <NativeUiInput
                      onChangeText={(e) => onChangeText(index, e)}
                      // value={item.value}
                    />
                  </View>
                ))}
                {/* <View style={styles.materialInput}>
                  <NativeUiInput />
                </View>
                <View style={styles.materialInput}>
                  <NativeUiInput />
                </View>
                <View style={styles.materialInput}>
                  <NativeUiInput />
                </View> */}
              </View>

              <View>
                <Pressable
                  onPress={() =>
                    setMaterialUsedArray([...materialUsedArray, { value: '' }])
                  }
                  style={[DefaultStyles.containerRow, styles.addMore]}
                >
                  <Entypo
                    name="plus"
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
                </Pressable>
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
          <View style={styles.input}>
            <NativeUiInput
              label={'What publish option do you want to set for this project'}
              placeholder={'Public'}
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
};
