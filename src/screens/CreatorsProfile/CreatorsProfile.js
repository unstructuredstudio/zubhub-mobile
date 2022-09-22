import {
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import {
  NativeUiText,
  NativeUiHeader,
  Avater,
  NativeUiButton,
  CommentCard,
} from '../../components';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { useDispatch, useSelector } from 'react-redux';
import styles from './CreatorsProfile.style';
import { getUserProfile } from '../../../src/ApiCall/api';
import * as THEME from '../../constants/theme';
import { ScrollView } from 'react-native-gesture-handler';
import { dFormatter } from '../../utils/script';
import { addComment } from '../../redux/actions/authAction';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const CreatorsProfile = ({ route }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const { t } = useTranslation();

  const [usersInfo, setUsersInfo] = useState({});
  const [showCommentSubmitButton, setShowCommentSubmitButton] = useState(false);
  const [commentObj, setCommentObj] = useState({
    text: '',
  });

  const navigation = useNavigation();

  const { username } = route.params;
  useEffect(() => {
    if (username) {
      let result = getUserProfile({ username: username, token: user?.token });
      result.then((el) => setUsersInfo(el));
    }
  }, []);

  const handleCommentChange = (key, value) => {
    let elem = { ...commentObj };
    elem[key] = value;
    setCommentObj(elem);
  };

  console.log(usersInfo);
  const onSubmitComment = () => {
    let result = addComment({
      ...commentObj,
      token: user?.token,
      id: usersInfo?.id,
    });
    result.then((res) => {
      setUsersInfo({
        ...usersInfo,
        comments: res?.profile?.comments,
      });
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <NativeUiHeader
        subScreen={true}
        sectionTitle={t('creatorsDetails.creatorsDetails')}
      />
      <ScrollView contentContainerStyle={styles.main}>
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            setShowCommentSubmitButton(false);
          }}
        >
          <View>
            <View style={DefaultStyles.containerRow}>
              <View style={styles.avaterContainer}>
                <Image
                  source={{ uri: usersInfo.avatar }}
                  style={styles.avater}
                />
              </View>

              <View style={styles.userDetails}>
                <NativeUiText textType={'medium'}>
                  {usersInfo?.username}
                </NativeUiText>

                <NativeUiText
                  style={styles.txt}
                  textColor={THEME.COLORS.PRIMARY_TEAL}
                  textType={'medium'}
                >
                  {usersInfo && usersInfo.tags && usersInfo?.tags[0]}
                </NativeUiText>
              </View>
            </View>

            <View style={styles.cardContainer}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('UsersProjects', {
                    from: 'OtherCreator',
                    data: usersInfo,
                  })
                }
                style={[styles.card, DefaultStyles.containerCenter]}
              >
                <NativeUiText textType="medium">
                  {user?.projects_count}{' '}
                </NativeUiText>
                <NativeUiText textType="bold">
                  {t('general.projects')}
                </NativeUiText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('UsersFollowers')}
                style={[styles.card, DefaultStyles.containerCenter]}
              >
                <NativeUiText textType="medium">
                  {usersInfo?.followers?.length}
                </NativeUiText>
                <NativeUiText textType="bold">
                  {t('general.followers')}
                </NativeUiText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('UsersFollowing')}
                style={[styles.card, DefaultStyles.containerCenter]}
              >
                <NativeUiText textType="medium">
                  {usersInfo?.following_count}
                </NativeUiText>
                <NativeUiText textType="bold">
                  {t('general.following')}
                </NativeUiText>
              </TouchableOpacity>
            </View>

            <View style={styles.aboutSection}>
              <NativeUiText
                fontSize={THEME.FONT_SIZE.MEDIUM}
                textType={'medium'}
              >
                {t('general.aboutMe')}
              </NativeUiText>
              <NativeUiText
                style={styles.aboutText}
                textColor={THEME.COLORS.SECONDARY_TEXT}
              >
                {usersInfo?.bio}
              </NativeUiText>
            </View>

            <View style={styles.aboutSection}>
              <NativeUiText fontSize={21} textType={'bold'}>
                {usersInfo?.comments?.length} {t('general.comments')}
              </NativeUiText>
              <View
                style={[
                  styles.commentBox,
                  {
                    height: showCommentSubmitButton ? 217 : 100,
                  },
                ]}
              >
                <View style={DefaultStyles.avaterContainer}>
                  <Image
                    source={{ uri: user?.user?.avatar }}
                    style={DefaultStyles.avater}
                  />
                </View>
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
                    label={t('general.comment')}
                  />
                )}
              </View>
              {usersInfo?.comments?.length > 0 && (
                <View style={styles.commentCard}>
                  {usersInfo?.comments?.map((comment) => (
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
    </SafeAreaView>
  );
};

export default CreatorsProfile;
