import {
  View,
  ScrollView,
  SafeAreaView,
  Image,
  Pressable,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import {
  NativeUiActivityIndicator,
  NativeUiHeader,
  NativeUiText,
} from '@components/';
import DefaultStyles from '../../constants/DefaultStyles.style';
import styles from './ProjectDetail.style';
import * as THEME from '../../constants/theme';
import { FloatingAction } from 'react-native-floating-action';
import Modal from 'react-native-modal';
import { WebView } from 'react-native-webview';
import { isCloudinaryVideo, isGdriveORVimeoORYoutube } from './ProjectScript';
import RenderHtml from 'react-native-render-html';
import { useSelector, useDispatch } from 'react-redux';
import { getProjectDetails } from '../../redux/actions/projectsAction';
import { toggleFollowOnProject } from '../../redux/actions/projectsAction';
import { loadUser } from '../../redux/actions/authAction';
import AutoHeightWebView from 'react-native-autoheight-webview';

const ProjectDetail = ({ route }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  const videoRef = React.useRef(null);
  const [selectedImage, setSelectedImage] = useState({
    imageUri: '',
    showModal: false,
  });
  const [loading, setLoading] = useState(false);
  const [projectDetails, setprojectDetails] = useState({});
  const [followState, setFollowState] = useState(null);
  const [webViewHeight, setWebViewHeight] = useState(null);

  const { item } = route.params;

  useEffect(() => {
    setLoading(true);
    let result = dispatch(getProjectDetails(item?.id, setLoading));
    result.then((res) => {
      setprojectDetails(res);
    });
  }, [item]);

  const actions = [
    {
      text: 'Claps: 0',
      icon: require('../images/clap.png'),
      name: 'bt_language',
      position: 1,
    },
    {
      text: 'Bookmark',
      icon: require('../images/bookmark.png'),
      name: 'bt_accessibility',
      position: 2,
    },

    {
      text: 'Views: 0',
      icon: require('../images/eye.png'),
      name: 'bt_room',
      position: 3,
    },
    {
      text: 'Facebook',
      icon: require('../images/facebook.png'),
      name: 'bt_videocam',
      position: 4,
    },
    {
      text: 'Whatsapp',
      icon: require('../images/whatsapp.png'),
      name: 'bt_videocam1',
      position: 5,
    },
    {
      text: 'URL',
      icon: require('../images/link.png'),
      name: 'bt_videocam2',
      position: 6,
    },
  ];

  const enlargeImage = (uri) => {
    setSelectedImage({
      imageUri: uri,
      showModal: true,
    });
  };
  const { width } = useWindowDimensions();

  console.log(projectDetails);
  // console.log(res.projectDetails.id);

  const toggleFollow = () => {
    let result = dispatch(
      toggleFollowOnProject({
        id: projectDetails?.creator?.id,
        token: user?.token,
      })
    );
    result.then((res) => {
      dispatch(loadUser(user?.token));
      setFollowState(res.creatorsInfo);
    });
  };

  const onWebViewMessage = (event) => {
    setWebViewHeight(Number(event.nativeEvent.data));
  };

  return (
    <SafeAreaView style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={'Project Details'} />
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
                        Edit
                      </NativeUiText>
                    </View>
                    <View style={[styles.delete, styles.authorDetails]}>
                      <NativeUiText
                        textColor={THEME.COLORS.WHITE}
                        textType={'medium'}
                        style={styles.authorDetails}
                      >
                        Delete
                      </NativeUiText>
                    </View>
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
                        {/* {followState !== null
                          ? followState?.followers?.length > 0
                            ? "UNFOLLOW"
                            : "FOLLOW"
                          : projectDetails?.creator?.followers?.length > 0
                          ? "UNFOLLOW"
                          : "FOLLOW"} */}

                        {followState !== null
                          ? followState?.followers?.includes(user?.user?.id)
                            ? 'UNFOLLOW'
                            : 'FOLLOW'
                          : projectDetails?.creator?.followers?.includes(
                              user?.user?.id
                            )
                          ? 'UNFOLLOW'
                          : 'FOLLOW'}
                      </NativeUiText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {projectDetails.images && projectDetails?.images.length > 0 ? (
              <>
                <View>
                  <View style={styles.mainImageContainer}>
                    <Image
                      style={styles.img}
                      source={{ uri: projectDetails?.images[0]?.image_url }}
                    />
                  </View>
                </View>
                {projectDetails?.images.length > 1 ? (
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
                    style={[styles.userProfilex, DefaultStyles.containerCenter]}
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
                {isGdriveORVimeoORYoutube(item.video) ? (
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
                  <WebView
                    originWhitelist={['*']}
                    source={{
                      html: `
                  <video width="920" controls>
                    <source 
                    src=${projectDetails?.video}
                     type="video/mp4">
                    <source src="movie.ogg" type="video/ogg">
                    Your browser does not support the video tag.
                  </video>
                 `,
                    }}
                  />
                )}
              </View>
            )}

            <View style={styles.userProfile}>
              <NativeUiText
                fontSize={21}
                textType={'medium'}
                style={styles.userProfile}
              >
                Description
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
                Materials Used
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
                Catergory
              </NativeUiText>

              <NativeUiText
                textColor={THEME.COLORS.SECONDARY_TEXT}
                style={styles.userProfile}
                fontSize={18}
              >
                {projectDetails?.category}
              </NativeUiText>
            </View>
          </ScrollView>

          <FloatingAction
            actions={actions}
            color={THEME.COLORS.PRIMARY_TEAL}
            onPressItem={(name) => {
              console.log(`selected button: ${name}`);
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default ProjectDetail;
