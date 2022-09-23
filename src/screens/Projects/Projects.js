import { AssetsSelector } from 'expo-images-picker';
import {
  View,
  ScrollView,
  FlatList,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiInput,
  NativeUiButton,
  NativeUiActionSheet,
  NativeKeyboardAvoidingView,
} from '@components/';
import * as THEME from '../../constants/theme';
import styles from './Projects.style';
import DefaultStyles from '../../constants/DefaultStyles.style';
import layout from '../../constants/layout';
import Entypo from 'react-native-vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Octicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import {
  initUpload,
  getAllCategories,
  buildPublishTypes,
} from '../../redux/actions/projectsAction';
import { useDispatch, useSelector } from 'react-redux';
import { SheetManager } from 'react-native-actions-sheet';
import QuillEditor, { QuillToolbar } from 'react-native-cn-quill';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

const Projects = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const projects = useSelector((state) => state.projects);

  const { t } = useTranslation();

  const ref = useRef(null);
  const [currentElemIndex, setCurrentElemIndex] = useState(0);
  const [categories, setCategories] = useState([]);
  const [imagesDataSet, setImagesDataSet] = useState([]);
  const [publishTypes, setPublishTypes] = useState([]);
  const [projectData, setProjectData] = useState({
    title: 'sss',
    description: '',
    video: null,
    materials_used: 'sss',
    category: 'Art',
    publish: {},
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(getAllCategories({ t: t })).then((category) =>
      setCategories(category?.categories)
    );
    let publishArray = buildPublishTypes(
      projects?.zubhub,
      setProjectData,
      projectData
    );
    setPublishTypes(publishArray && publishArray.publish_types);
  }, []);

  // useEffect(() => {
  //   console.log(projectData);
  // }, [projectData]);

  const componentsArray = [
    <LayoutOne
      t={t}
      projectData={projectData}
      setProjectData={setProjectData}
    />,
    <LayoutTwo
      t={t}
      projectData={projectData}
      setImagesDataSet={setImagesDataSet}
      imagesDataSet={imagesDataSet}
      setProjectData={setProjectData}
    />,
    <LayoutThree
      t={t}
      projectData={projectData}
      setProjectData={setProjectData}
      categories={categories}
      publishTypes={publishTypes}
      setPublishTypes={setPublishTypes}
    />,
  ];

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
    // setLoading(true);
    dispatch(
      initUpload({
        projectData,
        imagesDataSet,
        token: user?.token,
        setLoading,
        user,
      })
    );
  };
  // setLoading(false);

  return (
    <View style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={'Create Project'} />

      <View style={styles.topContainer}>
        <View style={[styles.introContainer]}>
          <NativeUiText fontSize={THEME.FONT_SIZE.LARGE} textType={'medium'}>
            {t('createProject.title')}
          </NativeUiText>
          <NativeUiText
            style={styles.createAccount}
            textColor={THEME.COLORS.SECONDARY_TEXT}
            textType={'medium'}
          >
            {t('createProject.tellUsAboutYourProject')}
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
                width: layout.window.width * 1,
                paddingHorizontal: 12,
              }}
            >
              {item}
            </View>
          )}
        />
      </NativeKeyboardAvoidingView>
      <View style={styles.bottomContainer}>
        {loading ? (
          <ActivityIndicator size={21} color={THEME.COLORS.PRIMARY_TEAL} />
        ) : (
          <NativeUiButton
            label={
              currentElemIndex === componentsArray.length - 1
                ? t('createProject.createProject')
                : t('general.next')
            }
            onPress={() =>
              currentElemIndex === componentsArray.length - 1
                ? onCreateProject()
                : goToNextSlide()
            }
          />
        )}
      </View>
    </View>
  );
};

export default Projects;

const LayoutOne = ({ projectData, setProjectData, t }) => {
  const _editor = React.createRef();

  const changeText = (e, key) => {
    const data = { ...projectData };
    data[key] = e;
    setProjectData(data);
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={[styles.introContainer, styles.topContainer]}>
          <View style={styles.input}>
            <NativeUiInput
              label={t('createProject.nameProject')}
              placeholder={t('createProject.projectName')}
              onChangeText={(e) => {
                changeText(e, 'title');
              }}
            />
          </View>
          <View style={styles.input}>
            <View
              style={{
                height: 300,
                width: '100%',
              }}
            >
              <QuillToolbar
                styles={{
                  toolbar: {
                    provider: (provided) => ({
                      borderTopWidth: 0,
                    }),
                    root: (provided) => ({
                      ...provided,
                      width: '100%',
                    }),
                  },
                }}
                editor={_editor}
                options="basic"
                theme="light"
              />
              <QuillEditor
                onHtmlChange={({ html }) => changeText(html, 'description')}
                style={styles.editor}
                ref={_editor}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const LayoutTwo = ({
  projectData,
  setProjectData,
  imagesDataSet,
  setImagesDataSet,
  t,
}) => {
  const [visible, setVisible] = useState(false);
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
  const [activeVideOption, setActiveVideOption] = useState('link');
  const [videoURL, setvideoURL] = useState('');

  const onChangeText = (index, txt) => {
    let arr = materialUsedArray;
    arr[index] = { value: txt };
    setMaterialUsedArray(arr);
    setProjectData({ ...projectData, materials_used: 'str' });
  };

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

  const pickVideo = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    setProjectData({ ...projectData, video: result });

    if (!result.cancelled) {
      // setImage(result.uri);
      // console.log(result.uri);
    }
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={[styles.introContainer, styles.topContainer]}>
          <NativeUiActionSheet
            id="videoUploadShet"
            sheetTitle="Select An Option"
          >
            <View>
              <View style={styles.optionContainer}>
                <TouchableOpacity
                  onPress={() => setActiveVideOption('link')}
                  style={
                    activeVideOption === 'link'
                      ? styles.defaultOption
                      : styles.unselectedOption
                  }
                >
                  <NativeUiText
                    textColor={
                      activeVideOption === 'link'
                        ? THEME.COLORS.WHITE
                        : THEME.COLORS.PRIMARY_TEAL
                    }
                  >
                    LINK VIDEO
                  </NativeUiText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveVideOption('device')}
                  style={
                    activeVideOption !== 'link'
                      ? styles.defaultOption
                      : styles.unselectedOption
                  }
                >
                  <NativeUiText
                    textColor={
                      activeVideOption !== 'link'
                        ? THEME.COLORS.WHITE
                        : THEME.COLORS.PRIMARY_TEAL
                    }
                  >
                    UPLOAD VIDEO
                  </NativeUiText>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.onSelectInput}>
              {activeVideOption === 'link' ? (
                <NativeUiInput
                  onChangeText={(txt) => setvideoURL(txt)}
                  placeholder={'https://youtube.com'}
                  label={'Video URL'}
                />
              ) : (
                <TouchableOpacity
                  onPress={async () => {
                    await SheetManager.show('videoUploadShet');
                    pickVideo();
                  }}
                  style={[
                    DefaultStyles.containerRow,
                    styles.imageContainer,
                    styles.elemHeight,
                  ]}
                >
                  <NativeUiText
                    textColor={THEME.COLORS.PRIMARY_TEAL}
                    textType={'medium'}
                    style={styles.txt}
                  >
                    TAP HERE TO UPLOAD
                  </NativeUiText>
                </TouchableOpacity>
              )}
            </View>

            <View style={[DefaultStyles.containerSpaced, styles.onSelectInput]}>
              <TouchableOpacity
                onPress={() => SheetManager.hide('videoUploadShet')}
                style={styles.cancelContainer}
              >
                <NativeUiText
                  textColor={THEME.COLORS.PRIMARY_TEAL}
                  textType={'medium'}
                >
                  Cancel
                </NativeUiText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  SheetManager.hide('videoUploadShet');
                  setProjectData({ ...projectData, video: videoURL });
                }}
                style={styles.uploadContainer}
              >
                <NativeUiText
                  textColor={THEME.COLORS.WHITE}
                  textType={'medium'}
                >
                  Upload
                </NativeUiText>
              </TouchableOpacity>
            </View>
          </NativeUiActionSheet>
          <View>
            <View style={styles.input}>
              <View>
                <NativeUiText textType="medium">
                  {t('createProject.addPictures')}
                </NativeUiText>
                <NativeUiText
                  fontSize={12}
                  textColor={THEME.COLORS.SECONDARY_TEXT}
                  style={styles.details}
                >
                  {t('createProject.dontHavePictures')}
                </NativeUiText>

                <View>
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
                      {t('createProject.addImages')}
                    </NativeUiText>
                  </TouchableOpacity>
                  {imagesDataSet.length > 0 && (
                    <NativeUiText
                      fontSize={12}
                      textColor={THEME.COLORS.PRIMARY_TEAL}
                      style={styles.imgAdded}
                    >
                      {imagesDataSet.length} {t('createProject.image')}
                      {imagesDataSet.length > 1 && 's'}{' '}
                      {t('createProject.added')}
                    </NativeUiText>
                  )}
                </View>
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
                <NativeUiText textType="medium">
                  {t('createProject.addVideo')}
                </NativeUiText>
                <NativeUiText
                  fontSize={12}
                  textColor={THEME.COLORS.SECONDARY_TEXT}
                  style={styles.details}
                >
                  {t('createProject.noVideo')}
                </NativeUiText>

                <TouchableOpacity
                  onPress={async () =>
                    await SheetManager.show('videoUploadShet')
                  }
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
                    {t('createProject.addVideoAction')}
                  </NativeUiText>
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <View style={styles.input}>
                <NativeUiText textType="medium" style={styles.materialsText}>
                  {t('createProject.materialUsed')}
                </NativeUiText>
                {materialUsedArray.map((_, index) => (
                  <View key={Math.random()} style={styles.materialInput}>
                    <NativeUiInput
                      onChangeText={(e) => onChangeText(index, e)}
                    />
                  </View>
                ))}
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
                    {t('createProject.addMore')}
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

const LayoutThree = ({
  projectData,
  setProjectData,
  categories,
  publishTypes,
  t,
}) => {
  const [publishCategory, setPublishCategory] = useState('');
  const changeText = (e, key) => {
    const data = { ...projectData };
    data[key] = e;
    setProjectData(data);
    SheetManager.hide('categorySheet');
  };

  const changePublish = (val) => {
    const data = { ...projectData };
    const publish = {
      type: val.value,
      visible_to: [],
    };
    data['publish'] = publish;
    setProjectData(data);
    setPublishCategory(val.name);
    SheetManager.hide('publishTypeSheet');
  };
  return (
    <>
      <ScrollView style={styles.container}>
        <NativeUiActionSheet
          id="categorySheet"
          sheetTitle={t('createProject.selectCategory')}
        >
          <View style={styles.categoryBox}>
            {categories?.map((cat) => (
              <TouchableOpacity
                onPress={() => changeText(cat.name, 'category')}
                style={styles.categoryView}
                key={cat.id}
              >
                <NativeUiText fontSize={16} textType={'medium'}>
                  {cat.name}
                </NativeUiText>
              </TouchableOpacity>
            ))}
          </View>
        </NativeUiActionSheet>
        <NativeUiActionSheet
          id="publishTypeSheet"
          sheetTitle={t('createProject.selectOption')}
        >
          <View style={styles.categoryBox}>
            {publishTypes?.map((val) => (
              <TouchableOpacity
                onPress={() => changePublish(val)}
                style={styles.categoryView}
                key={val.value}
              >
                <NativeUiText fontSize={16} textType={'medium'}>
                  {val.name}
                </NativeUiText>
              </TouchableOpacity>
            ))}
          </View>
        </NativeUiActionSheet>
        <View style={[styles.introContainer]}>
          <TouchableOpacity
            onPress={async () => await SheetManager.show('categorySheet')}
          >
            <NativeUiText textType="medium" style={styles.categoryText}>
              {t('createProject.projectCategory')}
            </NativeUiText>
            <View
              style={[styles.dropdownContainer, DefaultStyles.containerSpaced]}
            >
              <View style={styles.dropdown}>
                <NativeUiText>
                  {projectData?.category === ''
                    ? t('createProject.selectOption')
                    : projectData?.category}
                </NativeUiText>
              </View>
              <Octicons name="chevron-down" size={20} color="black" />
            </View>
          </TouchableOpacity>

          <View style={styles.input}>
            <NativeUiInput
              label={t('createProject.whatTagsDescribesYourProject')}
              placeholder={t('createProject.addTag')}
            />
          </View>

          <View>
            <NativeUiText textType="medium" style={styles.categoryText}>
              {t('createProject.publishOption')}
            </NativeUiText>
            <TouchableOpacity
              onPress={async () => await SheetManager.show('publishTypeSheet')}
              style={[styles.dropdownContainer, DefaultStyles.containerSpaced]}
            >
              <View style={styles.dropdown}>
                <NativeUiText>
                  {publishCategory === '' ? 'Public' : publishCategory}
                </NativeUiText>
              </View>
              <Octicons name="chevron-down" size={20} color="black" />
            </TouchableOpacity>
            <NativeUiText
              fontSize={12}
              textColor={THEME.COLORS.SECONDARY_TEXT}
              style={styles.roleText}
            >
              {t('createProject.descriptionSubTitle')}
            </NativeUiText>
          </View>
        </View>
      </ScrollView>
    </>
  );
};
