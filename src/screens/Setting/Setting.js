import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import {
  NativeUiText,
  NativeUiActionSheet,
  NativeUiButton,
} from '@components/';
import styles from './Setting.style';
import { SETTINGS_DATA } from '../../data';
import DefaultStyles from '../../constants/DefaultStyles.style';
import * as THEME from '../../constants/theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { SheetManager } from 'react-native-actions-sheet';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Setting = () => {
  return (
    <View>
      <NativeUiText fontSize={THEME.FONT_SIZE.MEDIUM} textType={'bold'}>
        Settings
      </NativeUiText>

      <NativeUiActionSheet id="languageSheet" sheetTitle="Change Language ">
        <View>
          <TouchableOpacity
            style={[DefaultStyles.containerRow, styles.itemElement]}
          >
            <View style={styles.circle}></View>
            <NativeUiText style={styles.info}>English</NativeUiText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[DefaultStyles.containerRow, styles.itemElement1]}
          >
            <View style={styles.circle}></View>
            <NativeUiText style={styles.info}>Hindi</NativeUiText>
          </TouchableOpacity>
        </View>
        <NativeUiButton
          onPress={async () => {}}
          label={'Toggle'}
          style={styles.space}
        />
      </NativeUiActionSheet>

      {SETTINGS_DATA.map((item, index) => (
        <TouchableOpacity
          key={index}
          onPress={() =>
            item.title == 'Change Language' &&
            SheetManager.show('languageSheet')
          }
          style={[DefaultStyles.containerSpaced, styles.card]}
        >
          <View style={DefaultStyles.containerRow}>
            <View style={[styles.iconContainer, DefaultStyles.containerCenter]}>
              {item.iconName === 'logout' ? (
                <MaterialCommunityIcons
                  name="logout"
                  size={24}
                  color={THEME.COLORS.PRIMARY_TEAL}
                />
              ) : (
                <FontAwesome
                  name={item.iconName}
                  size={24}
                  color={THEME.COLORS.PRIMARY_TEAL}
                />
              )}
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
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default Setting;
