import { View, Image } from 'react-native';
import React from 'react';
import { NativeUiText, Avater } from '@components/';
import styles from './NativeUiHeader.style';
import AntDesign from 'react-native-vector-icons/AntDesign';
import * as THEME from '../../constants/theme';
import DefaultStyles from '../../constants/DefaultStyles.style';

const NativeUiHeader = () => {
  return (
    <View style={[styles.headerContainer, DefaultStyles.conainerSpaced]}>
      <View style={styles.imgConainer}>
        <Image style={styles.img} source={require('@asset/logo.png')} />
      </View>
      <View style={styles.spacing}>
        <AntDesign
          style={styles.icon}
          name="search1"
          size={20}
          color={THEME.COLORS.WHITE}
        />
        <Avater w={40} h={40} uri={require('@asset/avater.jpg')} />
      </View>
    </View>
  );
};

export default NativeUiHeader;
