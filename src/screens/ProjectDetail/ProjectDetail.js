import {
  View,
  ScrollView,
  SafeAreaView,
  Image,
  Pressable,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import {
  NativeUiActivityIndicator,
  NativeUiHeader,
  Avater,
  NativeUiText,
  CommentCard,
  NativeUiButton,
} from '@components/';
import DefaultStyles from '../../constants/DefaultStyles.style';
import styles from './ProjectDetail.style';
import * as THEME from '../../constants/theme';
import { FloatingAction } from 'react-native-floating-action';
import Modal from 'react-native-modal';
import { WebView } from 'react-native-webview';
import { isGdriveORVimeoORYoutube } from './ProjectScript';
import { useSelector, useDispatch } from 'react-redux';
import {
  getProjectDetails,
  addAComment,
} from '../../redux/actions/projectsAction';
import {
  toggleFollowOnProject,
  toggleLikeOnProject,
  toggleSaveOnProject,
  deleteAProject,
} from '../../redux/actions/projectsAction';
import { loadUser } from '../../redux/actions/authAction';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { buildVideoThumbnailURL, dFormatter } from '../../utils/script';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useTranslation } from 'react-i18next';

const ProjectDetail = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  const { t } = useTranslation();

  const [selectedImage, setSelectedImage] = useState({
    imageUri: '',
    showModal: false,
  });
  const [loading, setLoading] = useState(false);
  const [projectDetails, setprojectDetails] = useState({});
  const [followState, setFollowState] = useState(null);
  const [webViewHeight, setWebViewHeight] = useState(null);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);
  const [commentObj, setCommentObj] = useState({
    text: '',
  });
  const [showCommentSubmitButton, setShowCommentSubmitButton] = useState(false);

  const { item } = route.params;

  useEffect(() => {
    setLoading(true);
    let result = dispatch(getProjectDetails(item?.id, setLoading, t));
    result.then((res) => {
      setprojectDetails(res);
    });
  }, [item]);

  const enlargeImage = (uri) => {
    setSelectedImage({
      imageUri: uri,
      showModal: true,
    });
  };

  const toggleFollow = () => {
    let result = dispatch(
      toggleFollowOnProject({
        id: projectDetails?.creator?.id,
        token: user?.token,
        t: t,
      })
    );
    result.then((res) => {
      dispatch(loadUser(user?.token));
      setFollowState(res.creatorsInfo);
    });
  };

  // console.log(projectDetails);
  const onWebViewMessage = (event) => {
    setWebViewHeight(Number(event.nativeEvent.data));
  };

  const handleCommentChange = (key, value) => {
    let elem = { ...commentObj };
    elem[key] = value;
    setCommentObj(elem);
  };

  const onClap = () => {
    let result = dispatch(
      toggleLikeOnProject({ id: projectDetails.id, token: user?.token, t: t })
    );
    result.then((res) => {
      setprojectDetails({ ...projectDetails, likes: res?.project?.likes });
    });
  };

  const onSave = () => {
    let result = dispatch(
      toggleSaveOnProject({ id: projectDetails.id, token: user?.token, t: t })
    );
    result.then((res) => {
      setprojectDetails({
        ...projectDetails,
        saved_by: res?.project?.saved_by,
      });
    });
  };

  const copyToCLipboard = async () => {
    try {
      await Clipboard.setStringAsync('play store link');
      Alert.alert(`${t('general.copied')}!`, `${t('projectCard.urlCopied')}`, [
        {
          text: t('general.Okay'),
        },
      ]);
    } catch (error) {
      Alert.alert(t('general.Okay'), t('projectCard.failedToCopyUrl'), [
        {
          text: t('general.Okay'),
        },
      ]);
    }
  };

  const onDelete = () => {
    Alert.alert(
      `${t('projectCard.deleteProjectMessage')}!`,
      `${t('projectCard.deleteProjectWarning')}!!`,
      [
        {
          text: t('general.cancel'),
        },
        {
          text: t('general.proceed'),
          onPress: () =>
            deleteAProject({
              id: projectDetails.id,
              token: user?.token,
              navigation: navigation,
              t: t,
            }).then((res) => res && navigation.navigate('UsersProjects')),
        },
      ]
    );
  };

  const actions = [
    {
      text: `${t('general.claps')}: ${projectDetails?.likes?.length}`,
      icon: projectDetails?.likes?.includes(user?.user?.id)
        ? require('../images/clap.png')
        : require('../images/clap.png'),
      name: 'clap',
      position: 1,
    },

    {
      text: t('general.bookmark'),
      icon: projectDetails?.saved_by?.includes(user?.user?.id)
        ? require('../images/bookmarkFill.png')
        : require('../images/bookmark.png'),
      name: 'bookmark',
      position: 2,
    },

    {
      text: `${t('general.views')}: ${projectDetails?.views_count}`,
      icon: require('../images/eye.png'),
      name: 'views',
      position: 3,
    },
    {
      text: 'Facebook',
      icon: require('../images/facebook.png'),
      name: 'facebook',
      position: 4,
    },
    {
      text: 'Whatsapp',
      icon: require('../images/whatsapp.png'),
      name: 'whatsapp',
      position: 5,
    },
    {
      text: t('general.url'),
      icon: require('../images/link.png'),
      name: 'url',
      position: 6,
    },
  ];

  const onActionPress = (name) => {
    switch (name) {
      case 'clap':
        return onClap();

      case 'bookmark':
        return onSave();

      case 'views':
        return;

      case 'facebook':
        return Linking.openURL('https://www.facebook.com/sharer/sharer.php?u=');

      case 'whatsapp':
        return Linking.openURL('https://web.whatsapp.com/send?text=');

      case 'url':
        return copyToCLipboard();
    }
  };

  const onSubmitComment = () => {
    let result = addAComment({
      ...commentObj,
      token: user?.token,
      id: projectDetails?.id,
      t: t,
    });
    result.then((res) => {
      setprojectDetails({
        ...projectDetails,
        comments: res?.project?.comments,
      });
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <NativeUiHeader
        subScreen={true}
        sectionTitle={t('projectCard.projectDetailTitle')}
      />
      <Modal
        isVisible={selectedImage.showModal}
        onBackdropPress={() => {
          setSelectedImage({
            showModal: false,
          });
        }}
      >
        <View style={[DefaultStyles.containerCenter]}>
          <View style={styles.fullImage}>
            <Image
              resizeMode="contain"
              style={styles.img}
              source={{ uri: selectedImage.imageUri }}
            />
          </View>
        </View>
      </Modal>
      {loading ? (
        <NativeUiActivityIndicator />
      ) : (
        <>
          <ScrollView style={styles.topContainer}>
            <TouchableWithoutFeedback
              onPress={() => {
                Keyboard.dismiss();
                setShowCommentSubmitButton(false);
              }}
            >
              <View>
                <View style={DefaultStyles.containerCenter}>
                  <NativeUiText fontSize={21} textType={'medium'}>
                    {projectDetails?.title}
                  </NativeUiText>
                </View>
                <View
                  style={[
                    DefaultStyles.containerCenter,
                    DefaultStyles.containerRow,
                    styles.userProfile,
                  ]}
                >
                  <View style={styles.avaterContainer}>
                    <Image
                      source={{ uri: projectDetails?.creator?.avatar }}
                      style={styles.avater}
                    />
                  </View>
                  <NativeUiText style={styles.authorDetails} fontSize={16}>
                    {projectDetails?.creator?.username}
                  </NativeUiText>
                  <View
                    style={[
                      DefaultStyles.containerCenter,
                      DefaultStyles.containerRow,
                    ]}
                  >
                    {user?.user?.id === projectDetails?.creator?.id ? (
                      <View
                        style={[
                          DefaultStyles.containerCenter,
                          DefaultStyles.containerRow,
                        ]}
                      >
                        <View style={[styles.follow, styles.authorDetails]}>
                          <NativeUiText
                            textColor={THEME.COLORS.WHITE}
                            textType={'medium'}
                          >
                            {t('general.edit')}
                          </NativeUiText>
                        </View>
                        <TouchableOpacity
                          onPress={onDelete}
                          style={[styles.delete, styles.authorDetails]}
                        >
                          <NativeUiText
                            textColor={THEME.COLORS.WHITE}
                            textType={'medium'}
                            style={styles.authorDetails}
                          >
                            {t('general.delete')}
                          </NativeUiText>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View
                        style={[
                          DefaultStyles.containerCenter,
                          DefaultStyles.containerRow,
                        ]}
                      >
                        <TouchableOpacity
                          onPress={toggleFollow}
                          style={[styles.follow, styles.authorDetails]}
                        >
                          <NativeUiText
                            textColor={THEME.COLORS.WHITE}
                            textType={'medium'}
                          >
                            {followState !== null
                              ? followState?.followers?.includes(user?.user?.id)
                                ? t('general.follow')
                                : t('general.unfollow')
                              : projectDetails?.creator?.followers?.includes(
                                  user?.user?.id
                                )
                              ? t('general.follow')
                              : t('general.unfollow')}
                          </NativeUiText>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>

                {projectDetails.images && projectDetails?.images?.length > 0 ? (
                  <>
                    <View>
                      <View style={styles.mainImageContainer}>
                        <Image
                          style={styles.img}
                          source={{ uri: projectDetails?.images[0]?.image_url }}
                        />
                      </View>
                    </View>
                    {projectDetails?.images?.length > 1 ? (
                      <View style={[styles.userProfilex]}>
                        <ScrollView
                          showsHorizontalScrollIndicator={false}
                          horizontal
                          style={styles.imageSlide}
                        >
                          {projectDetails?.images.map((image, index) => (
                            <Pressable
                              key={index}
                              onPress={() => enlargeImage(image.image_url)}
                            >
                              <Image
                                style={styles.individualImageSlider}
                                source={{ uri: image.image_url }}
                              />
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() =>
                          enlargeImage(projectDetails?.images[0]?.image_url)
                        }
                        style={[
                          styles.userProfilex,
                          DefaultStyles.containerCenter,
                        ]}
                      >
                        <Image
                          style={styles.individualImageSlider}
                          source={{ uri: projectDetails?.images[0]?.image_url }}
                        />
                      </Pressable>
                    )}
                  </>
                ) : (
                  <View style={styles.webView}>
                    {projectDetails && projectDetails?.video && (
                      <>
                        {isGdriveORVimeoORYoutube(projectDetails?.video) ? (
                          <WebView
                            originWhitelist={['*']}
                            source={{
                              html: `
                      <iframe width="920" height="600"
                        title={item.title}
                        src=${projectDetails?.video}
                    ></iframe>
                     `,
                            }}
                          />
                        ) : (
                          <>
                            {shouldPlayVideo ? (
                              <WebView
                                originWhitelist={['*']}
                                source={{
                                  html: `
                              <video
                                width="100%"  height="600" autoplay controls>
                                <source
                                src=${projectDetails?.video}
                                type="video/mp4">
                                  <source src="movie.ogg" type="video/ogg">
                                  Your browser does not support the video tag.
                              </video> `,
                                }}
                              />
                            ) : (
                              <TouchableOpacity
                                onPress={() => setShouldPlayVideo(true)}
                              >
                                <Image
                                  source={{
                                    uri: buildVideoThumbnailURL(
                                      projectDetails.video
                                    ),
                                  }}
                                  style={styles.image}
                                />
                                <View
                                  style={[
                                    styles.videoIcon,
                                    DefaultStyles.containerCenter,
                                  ]}
                                >
                                  <AntDesign
                                    name="youtube"
                                    size={102}
                                    color={THEME.COLORS.PRIMARY_TEAL}
                                  />
                                </View>
                              </TouchableOpacity>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </View>
                )}

                <View style={styles.userProfile}>
                  <NativeUiText
                    fontSize={21}
                    textType={'medium'}
                    style={styles.userProfile}
                  >
                    {t('general.description')}
                  </NativeUiText>

                  <View>
                    <WebView
                      scrollEnabled={false}
                      originWhitelist={['*']}
                      source={{
                        html: `
                  <!DOCTYPE html>
                  <html lang="en">
                  <head>
                      <meta charset="UTF-8">
                      <meta http-equiv="X-UA-Compatible" content="IE=edge">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body>
                      ${projectDetails?.description}

                  </body>
                  </html>
                  `,
                      }}
                      onMessage={onWebViewMessage}
                      injectedJavaScript="window.ReactNativeWebView.postMessage(document.body.scrollHeight)"
                      style={{
                        height: webViewHeight + 20,
                      }}
                    />
                  </View>
                </View>

                <View style={styles.userProfile}>
                  <NativeUiText
                    fontSize={21}
                    textType={'medium'}
                    style={styles.userProfile}
                  >
                    {t('general.materailUsed')}
                  </NativeUiText>

                  <View style={styles.materialPrimary}>
                    {projectDetails?.materials_used &&
                      projectDetails?.materials_used
                        .split(',')
                        .map((material, index) => (
                          <View key={index} style={styles.materialContainer}>
                            <NativeUiText
                              textColor={THEME.COLORS.PRIMARY_TEAL}
                              textType={'medium'}
                            >
                              {material}{' '}
                            </NativeUiText>
                          </View>
                        ))}
                  </View>
                </View>

                <View style={styles.userProfile}>
                  <NativeUiText
                    fontSize={21}
                    textType={'medium'}
                    style={styles.userProfile}
                  >
                    {t('general.category')}
                  </NativeUiText>

                  <NativeUiText
                    textColor={THEME.COLORS.SECONDARY_TEXT}
                    style={styles.userProfile}
                    fontSize={18}
                  >
                    {projectDetails?.category}
                  </NativeUiText>
                </View>

                <View style={styles.userProfile}>
                  <NativeUiText fontSize={21} textType={'bold'}>
                    {projectDetails?.comments?.length} {t('general.comments')}
                  </NativeUiText>
                  <View style={[styles.commentBox]}>
                    <Avater
                      width={35}
                      height={35}
                      uri={require('@asset/avater.jpg')}
                      radius={18}
                    />
                    <View>
                      <TextInput
                        onFocus={() => setShowCommentSubmitButton(true)}
                        onChangeText={(txt) => handleCommentChange('text', txt)}
                        multiline={true}
                        style={styles.input}
                        placeholder={t('general.writeAComment')}
                      />
                    </View>
                    {showCommentSubmitButton && (
                      <NativeUiButton
                        onPress={onSubmitComment}
                        height={35}
                        btnWidth={'35%'}
                        label={'Comment'}
                      />
                    )}
                  </View>
                  {projectDetails?.comments?.length > 0 && (
                    <View style={styles.commentCard}>
                      {projectDetails?.comments?.map((comment) => (
                        <View key={comment.created_on} style={styles.comments}>
                          <CommentCard
                            authorName={comment?.creator?.username}
                            commentTime={`${
                              dFormatter(comment?.created_on).value
                            } ${dFormatter(comment?.created_on).key} ago`}
                            commentBody={comment?.text}
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>

          <FloatingAction
            actions={actions}
            color={THEME.COLORS.PRIMARY_TEAL}
            onPressItem={(name) => onActionPress(name)}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default ProjectDetail;
