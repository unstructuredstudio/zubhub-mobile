import React from 'react';
import { ScrollView, View, TextInput } from 'react-native';
import { NativeUiText, Avater, CommentCard } from '@components/';
import styles from './Setting.style';
import { SETTINGS_DATA } from '../../data';
import DefaultStyles from '../../constants/DefaultStyles.style';
import * as THEME from '../../constants/theme';
import AntDesign from 'react-native-vector-icons/AntDesign';

const Setting = () => {
  return (
    <View>
      <NativeUiText fontSize={THEME.FONT_SIZE.MEDIUM} textType={'bold'}>
        Settings
      </NativeUiText>

      {SETTINGS_DATA.map((item) => (
        <View style={[DefaultStyles.containerSpaced, styles.card]}>
          <View style={DefaultStyles.containerRow}>
            <View style={[styles.iconContainer, DefaultStyles.containerCenter]}>
              <NativeUiText>{item.iconName} </NativeUiText>
            </View>
            <View style={styles.info}>
              <NativeUiText
                textColor={THEME.COLORS.PRIMARY_TEXT}
                textType={'medium'}
              >
                {item.title}
              </NativeUiText>
              <NativeUiText
                textColor={THEME.COLORS.SECONDARY_TEXT}
                textType={'medium'}
                style={styles.txt}
              >
                {item.subTitle}
              </NativeUiText>
            </View>
          </View>
          <View>
            <AntDesign
              style={styles.icon}
              name="arrowright"
              size={20}
              color={THEME.COLORS.BLACK}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

export default Setting;
