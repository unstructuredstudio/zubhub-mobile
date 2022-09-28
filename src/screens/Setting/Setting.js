import React, { useState } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../redux/actions/authAction';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const Setting = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState('');

  const quickActions = (title) => {
    switch (title) {
      case 'general.changeLanguage':
        return SheetManager.show('languageSheet');
      case 'general.logout':
        return dispatch(logoutUser(user?.token, navigation, t));
    }
  };

  const toggleLanguage = async () => {
    console.log(language);
    i18n.changeLanguage(language === 'english' ? 'en' : 'hi');
    await SheetManager.hide('languageSheet');
  };

  return (
    <View>
      <NativeUiText fontSize={THEME.FONT_SIZE.MEDIUM} textType={'bold'}>
        {t('general.settings')}
      </NativeUiText>

      <NativeUiActionSheet
        id="languageSheet"
        sheetTitle={t('general.toggleLanguage')}
      >
        <View>
          <TouchableOpacity
            onPress={() => setLanguage('english')}
            style={[DefaultStyles.containerRow, styles.itemElement]}
          >
            <View
              style={[
                styles.circle,
                language === 'english' && {
                  backgroundColor: THEME.COLORS.PRIMARY_YELLOW,
                  borderWidth: 0,
                },
              ]}
            ></View>
            <NativeUiText style={styles.info}>
              {t('general.english')}
            </NativeUiText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setLanguage('hindi')}
            style={[DefaultStyles.containerRow, styles.itemElement1]}
          >
            <View
              style={[
                styles.circle,
                language === 'hindi' && {
                  backgroundColor: THEME.COLORS.PRIMARY_YELLOW,
                  borderWidth: 0,
                },
              ]}
            ></View>
            <NativeUiText style={styles.info}>
              {t('general.hindi')}
            </NativeUiText>
          </TouchableOpacity>
        </View>
        <NativeUiButton
          onPress={toggleLanguage}
          label={t('general.toggle')}
          style={styles.space}
        />
      </NativeUiActionSheet>

      {SETTINGS_DATA.map((item, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => quickActions(item.title)}
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
                {t(item.title)}
              </NativeUiText>
              <NativeUiText
                textColor={THEME.COLORS.SECONDARY_TEXT}
                textType={'medium'}
                style={styles.txt}
              >
                {t(item.subTitle)}
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
