import { View, Text } from 'react-native';
import React from 'react';
import { NativeUiText, Avater } from '@components/';
import Entypo from 'react-native-vector-icons/Entypo';
import * as THEME from '../../constants/theme';
import DefaultStyles from '../../constants/DefaultStyles.style';
import styles from './CommentCard.style';

const CommentCard = () => {
  return (
    <View style={styles.container}>
      <View style={DefaultStyles.containerRow}>
        <Avater width={40} height={40} uri={require('@asset/avater.jpg')} />
        <View style={styles.authorsDretails}>
          <NativeUiText textType="medium">Alice Ndeh</NativeUiText>
          <NativeUiText
            style={styles.txt}
            textColor={THEME.COLORS.SECONDARY_TEXT}
            fontSize={THEME.FONT_SIZE.SMALL}
          >
            13 minutes ago
          </NativeUiText>
        </View>
      </View>

      <View>
        <NativeUiText style={styles.txt} fontSize={13}>
          Lorem ipsum dolor sit amet,conse Lorem ipsum dolor sit amet,conse
        </NativeUiText>
      </View>

      <View style={[DefaultStyles.containerRow, styles.txt]}>
        <NativeUiText
          textColor={THEME.COLORS.PRIMARY_TEAL}
          fontSize={THEME.FONT_SIZE.SMALL}
          textType={'medium'}
        >
          REPLY
        </NativeUiText>
        <Entypo name="reply" size={18} color={THEME.COLORS.PRIMARY_TEAL} />
      </View>
    </View>
  );
};

export default CommentCard;
