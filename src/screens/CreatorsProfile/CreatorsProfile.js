import {
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import {
  NativeUiText,
  NativeUiHeader,
  Avater,
  CommentCard,
} from '../../components';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { useDispatch, useSelector } from 'react-redux';
import styles from './CreatorsProfile.style';
import { getUserProfile } from '../../../src/ApiCall/api';
import * as THEME from '../../constants/theme';
import { ScrollView } from 'react-native-gesture-handler';
import { dFormatter } from '../../utils/script';

const CreatorsProfile = ({ route }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  const [usersInfo, setUsersInfo] = useState({});
  const [showCommentSubmitButton, setShowCommentSubmitButton] = useState(false);

  const { username } = route.params;
  useEffect(() => {
    if (username) {
      let result = getUserProfile({ username: username, token: user?.token });
      result.then((el) => setUsersInfo(el));
    }
  }, []);

  console.log(usersInfo);

  return (
    <SafeAreaView style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={'Creators Detail'} />
      <ScrollView contentContainerStyle={styles.main}>
        <View style={DefaultStyles.containerRow}>
          <View style={styles.avaterContainer}>
            <Image source={{ uri: usersInfo.avatar }} style={styles.avater} />
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
            onPress={() => navigation.navigate('UsersProjects')}
            style={[styles.card, DefaultStyles.containerCenter]}
          >
            <NativeUiText textType="medium">
              {user?.projects_count}{' '}
            </NativeUiText>
            <NativeUiText textType="bold">Projects </NativeUiText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('UsersFollowers')}
            style={[styles.card, DefaultStyles.containerCenter]}
          >
            <NativeUiText textType="medium">
              {usersInfo?.followers?.length}
            </NativeUiText>
            <NativeUiText textType="bold">Followers </NativeUiText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('UsersFollowing')}
            style={[styles.card, DefaultStyles.containerCenter]}
          >
            <NativeUiText textType="medium">
              {usersInfo?.following_count}{' '}
            </NativeUiText>
            <NativeUiText textType="bold">Following </NativeUiText>
          </TouchableOpacity>
        </View>

        <View style={styles.aboutSection}>
          <NativeUiText fontSize={THEME.FONT_SIZE.MEDIUM} textType={'medium'}>
            About Me
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
            {usersInfo?.comments?.length} Comments
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
                placeholder="Write a comment....."
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
          {usersInfo?.comments?.length > 0 && (
            <View style={styles.commentCard}>
              {usersInfo?.comments?.map((comment) => (
                <View key={comment.created_on} style={styles.comments}>
                  <CommentCard
                    authorName={comment?.creator?.username}
                    commentTime={`${dFormatter(comment?.created_on).value} ${
                      dFormatter(comment?.created_on).key
                    } ago`}
                    commentBody={comment?.text}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreatorsProfile;
