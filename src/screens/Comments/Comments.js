import React from 'react';
import { ScrollView, View, TextInput } from 'react-native';
import { NativeUiText, Avater, CommentCard } from '@components/';
import styles from './Comments.style';
import { USER_DETAILS } from '../../data';
import DefaultStyles from '../../constants/DefaultStyles.style';
import * as THEME from '../../constants/theme';

const Comments = () => {
  return (
    <ScrollView>
      <NativeUiText fontSize={THEME.FONT_SIZE.MEDIUM} textType={'bold'}>
        3 Comments
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
            multiline={true}
            style={styles.input}
            placeholder="Write a comment....."
          />
        </View>
      </View>
      <View style={styles.commentCard}>
        <CommentCard />
      </View>
      <View style={styles.commentCard}>
        <CommentCard />
      </View>
      <View style={styles.commentCard}>
        <CommentCard />
      </View>
    </ScrollView>
  );
};

export default Comments;
