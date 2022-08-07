import {
  View,
  ScrollView,
  SafeAreaView,
  Image,
  Pressable,
  useWindowDimensions,
} from "react-native";
import React, { useState, useEffect } from "react";
import {
  NativeUiActivityIndicator,
  NativeUiHeader,
  NativeUiText,
} from "@components/";
import DefaultStyles from "../../constants/DefaultStyles.style";
import styles from "./ProjectDetail.style";
import * as THEME from "../../constants/theme";
import { FloatingAction } from "react-native-floating-action";
import Modal from "react-native-modal";
import { WebView } from "react-native-webview";
import { isCloudinaryVideo, isGdriveORVimeoORYoutube } from "./ProjectScript";
import RenderHtml from "react-native-render-html";
import { useSelector, useDispatch } from "react-redux";
import { getProjectDetails } from "../../redux/actions/projectsAction";

const ProjectDetail = ({ route }) => {
  const dispatch = useDispatch();
  const videoRef = React.useRef(null);
  const [selectedImage, setSelectedImage] = useState({
    imageUri: "",
    showModal: false,
  });
  const [loading, setLoading] = useState(false);
  const [projectDetails, setprojectDetails] = useState({});

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
      text: "Claps: 0",
      icon: require("../images/clap.png"),
      name: "bt_language",
      position: 1,
    },
    {
      text: "Bookmark",
      icon: require("../images/bookmark.png"),
      name: "bt_accessibility",
      position: 2,
    },

    {
      text: "Views: 0",
      icon: require("../images/eye.png"),
      name: "bt_room",
      position: 3,
    },
    {
      text: "Facebook",
      icon: require("../images/facebook.png"),
      name: "bt_videocam",
      position: 4,
    },
    {
      text: "Whatsapp",
      icon: require("../images/whatsapp.png"),
      name: "bt_videocam",
      position: 5,
    },
    {
      text: "URL",
      icon: require("../images/link.png"),
      name: "bt_videocam",
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

  useEffect(() => {
    if (projectDetails?.materials_used) {
      console.log(projectDetails?.materials_used.split(","));
    }
  }, [projectDetails]);
  return (
    <SafeAreaView style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={"Project Details"} />
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
              <NativeUiText fontSize={21} textType={"medium"}>
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
              <View style={[styles.follow, styles.authorDetails]}>
                <NativeUiText
                  textColor={THEME.COLORS.WHITE}
                  textType={"medium"}
                >
                  FOLLOW
                </NativeUiText>
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
                      {projectDetails?.images.map((image) => (
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
                    originWhitelist={["*"]}
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
                    originWhitelist={["*"]}
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
                textType={"medium"}
                style={styles.userProfile}
              >
                Description
              </NativeUiText>

              <View>
                <RenderHtml
                  contentWidth={width}
                  source={{
                    html: `
             ${projectDetails?.description}
                 `,
                  }}
                />
              </View>
            </View>

            <View style={styles.userProfile}>
              <NativeUiText
                fontSize={21}
                textType={"medium"}
                style={styles.userProfile}
              >
                Materials Used
              </NativeUiText>

              <View style={styles.materialPrimary}>
                {projectDetails?.materials_used &&
                  projectDetails?.materials_used.split(",").map((material) => (
                    <View style={styles.materialContainer}>
                      <NativeUiText
                        textColor={THEME.COLORS.PRIMARY_TEAL}
                        textType={"medium"}
                      >
                        {material}{" "}
                      </NativeUiText>
                    </View>
                  ))}
              </View>
            </View>

            <View style={styles.userProfile}>
              <NativeUiText
                fontSize={21}
                textType={"medium"}
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
