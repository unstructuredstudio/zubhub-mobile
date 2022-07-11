import React from 'react';
import { ScrollView, View, Image } from 'react-native';
import { NativeUiText, Avater } from '@components/';
import styles from './About.style';
import { USER_DETAILS } from '../../data';
import DefaultStyles from '../../constants/DefaultStyles.style';
import * as THEME from '../../constants/theme';

const About = ({ aboutData }) => {
  const {
    authorsName,
    authorsEmail,
    authorsNumber,
    authorsTag,
    NoP,
    NoF,
    following,
    bio,
  } = aboutData;
  return (
    <ScrollView style={styles.container}>
      <View style={DefaultStyles.containerRow}>
        <Avater
          width={67}
          height={67}
          uri={require('@asset/avater.jpg')}
          radius={15}
        />
        <View style={styles.userDetails}>
          <NativeUiText fontSize={THEME.FONT_SIZE.SMALL} textType={'medium'}>
            {authorsName}
          </NativeUiText>
          <NativeUiText
            style={styles.txt}
            fontSize={12}
            textColor={THEME.COLORS.SECONDARY_TEXT}
          >
            {authorsEmail}
          </NativeUiText>
          <NativeUiText
            style={styles.txt}
            fontSize={12}
            textColor={THEME.COLORS.SECONDARY_TEXT}
          >
            {authorsNumber}
          </NativeUiText>
          <NativeUiText
            style={styles.txt}
            fontSize={12}
            textColor={THEME.COLORS.PRIMARY_TEAL}
            textType={'medium'}
          >
            {authorsTag}
          </NativeUiText>
        </View>
      </View>

      <View style={styles.cardContainer}>
        {USER_DETAILS.map((item, index) => (
          <View
            key={index}
            style={[styles.card, DefaultStyles.containerCenter]}
          >
            <NativeUiText textType="medium">{item.value} </NativeUiText>
            <NativeUiText textType="bold">{item.title} </NativeUiText>
          </View>
        ))}
      </View>

      <View style={styles.aboutSection}>
        <NativeUiText fontSize={THEME.FONT_SIZE.MEDIUM} textType={'medium'}>
          About Me
        </NativeUiText>
        <NativeUiText
          style={styles.aboutText}
          textColor={THEME.COLORS.SECONDARY_TEXT}
        >
          {bio}
        </NativeUiText>
      </View>
    </ScrollView>
  );
};

export default About;
