import { View, Text, TouchableOpacity, Alert } from 'react-native';
import React from 'react';
import { NativeUiText, Avater } from '@components/';
import Entypo from 'react-native-vector-icons/Entypo';
import * as THEME from '../../constants/theme';
import DefaultStyles from '../../constants/DefaultStyles.style';
import styles from './CommentCard.style';

const CommentCard = ({ authorName, commentTime, commentBody }) => {
  return (
    <View style={styles.container}>
      <View style={DefaultStyles.containerRow}>
        <Avater width={40} height={40} uri={require('@asset/avater.jpg')} />
        <View style={styles.authorsDretails}>
          <NativeUiText textType="medium"> {authorName} </NativeUiText>
          <NativeUiText
            style={styles.txt}
            textColor={THEME.COLORS.SECONDARY_TEXT}
            fontSize={THEME.FONT_SIZE.SMALL}
          >
            {commentTime}
          </NativeUiText>
        </View>
      </View>

      <View>
        <NativeUiText style={styles.txt} fontSize={13}>
          {commentBody}
        </NativeUiText>
      </View>

      <TouchableOpacity
        onPress={() => {
          Alert.alert(
            'Coming soon!',
            'We are working hard to make this available. Stay tunned for our next update'
          );
        }}
        style={[DefaultStyles.containerRow, styles.txt]}
      >
        <NativeUiText
          textColor={THEME.COLORS.PRIMARY_TEAL}
          fontSize={THEME.FONT_SIZE.SMALL}
          textType={'medium'}
        >
          REPLY
        </NativeUiText>
        <Entypo name="reply" size={18} color={THEME.COLORS.PRIMARY_TEAL} />
      </TouchableOpacity>
    </View>
  );
};

export default CommentCard;
