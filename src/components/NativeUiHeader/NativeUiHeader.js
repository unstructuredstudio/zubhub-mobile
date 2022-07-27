import { View, Image, TouchableOpacity } from 'react-native';
import React from 'react';
import { NativeUiText, Avater } from '@components/';
import styles from './NativeUiHeader.style';
import AntDesign from 'react-native-vector-icons/AntDesign';
import * as THEME from '../../constants/theme';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { useNavigation } from '@react-navigation/native';

const NativeUiHeader = ({ subScreen, sectionTitle }) => {
  const navigation = useNavigation();
  return (
    <View style={styles.headerContainer}>
      {subScreen ? (
        <View style={DefaultStyles.containerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[DefaultStyles.containerCenter, styles.header]}
          >
            <AntDesign
              style={styles.icon}
              name="arrowleft"
              size={20}
              color={THEME.COLORS.WHITE}
            />
          </TouchableOpacity>
          <View style={styles.sectionTitleContainer}>
            <NativeUiText
              style={{
                textAlign: 'center',
              }}
              fontSize={THEME.FONT_SIZE.LARGE}
              textType={'medium'}
              textColor={THEME.COLORS.WHITE}
            >
              {sectionTitle}
            </NativeUiText>
          </View>
          {/* <View />
          <View /> */}
        </View>
      ) : (
        <View style={[DefaultStyles.containerSpaced, styles.container]}>
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
            <Avater uri={require('@asset/avater.jpg')} />
          </View>
        </View>
      )}
    </View>
  );
};

export default NativeUiHeader;
