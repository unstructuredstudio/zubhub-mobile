import {
  View,
  ScrollView,
  SafeAreaView,
  Image,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { NativeUiHeader, NativeUiText } from '@components/';
import DefaultStyles from '../../constants/DefaultStyles.style';
import styles from './ProjectDetail.style';
import * as THEME from '../../constants/theme';
import { FloatingAction } from 'react-native-floating-action';
import Modal from 'react-native-modal';
import { WebView } from 'react-native-webview';
import { isCloudinaryVideo, isGdriveORVimeoORYoutube } from './ProjectScript';
import RenderHtml from 'react-native-render-html';

const ProjectDetail = ({ route }) => {
  const videoRef = React.useRef(null);
  const [status, setStatus] = React.useState({});
  const [selectedImage, setSelectedImage] = useState({
    imageUri: '',
    showModal: false,
  });

  const { item } = route.params;
  console.log(item);

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
      name: 'bt_videocam',
      position: 5,
    },
    {
      text: 'URL',
      icon: require('../images/link.png'),
      name: 'bt_videocam',
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
      <ScrollView style={styles.topContainer}>
        <View style={DefaultStyles.containerCenter}>
          <NativeUiText fontSize={21} textType={'medium'}>
            {item?.title}
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
              source={{ uri: item?.creator.avatar }}
              style={styles.avater}
            />
          </View>
          <NativeUiText style={styles.authorDetails} fontSize={16}>
            {item?.creator.username}
          </NativeUiText>
          <View style={[styles.follow, styles.authorDetails]}>
            <NativeUiText textColor={THEME.COLORS.WHITE} textType={'medium'}>
              FOLLOW
            </NativeUiText>
          </View>
        </View>

        {item?.images.length > 0 ? (
          <>
            <View>
              <View style={styles.mainImageContainer}>
                <Image
                  style={styles.img}
                  source={{ uri: item?.images[0].image_url }}
                />
              </View>
            </View>
            {item?.images.length > 1 ? (
              <View style={[styles.userProfilex]}>
                <ScrollView
                  showsHorizontalScrollIndicator={false}
                  horizontal
                  style={styles.imageSlide}
                >
                  {item?.images.map((image) => (
                    <Pressable
                      key={image.public_id}
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
                onPress={() => enlargeImage(item.images[0].image_url)}
                style={[styles.userProfilex, DefaultStyles.containerCenter]}
              >
                <Image
                  style={styles.individualImageSlider}
                  source={{ uri: item.images[0].image_url }}
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
                    src=${item.video}
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
                    src=${item.video}
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
            <RenderHtml
              contentWidth={width}
              source={{
                html: `
             ${item.description}
                 `,
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

          <NativeUiText style={styles.userProfile}>
            {/* {item.description} */}
          </NativeUiText>
        </View>

        <View style={styles.userProfile}>
          <NativeUiText
            fontSize={21}
            textType={'medium'}
            style={styles.userProfile}
          >
            Catergory
          </NativeUiText>

          <NativeUiText style={styles.userProfile}>
            {/* {item.description} */}
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
    </SafeAreaView>
  );
};

export default ProjectDetail;
