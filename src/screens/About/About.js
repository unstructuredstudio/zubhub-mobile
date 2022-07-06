import React from 'react';
import { ScrollView, View, Image } from 'react-native';
import { NativeUiText, Avater } from '@components/';
import styles from './About.style';
import { USER_DETAILS } from '../../data';
import DefaultStyles from '../../constants/DefaultStyles.style';
import * as THEME from '../../constants/theme';

const About = () => {
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
            Alice Ndeh
          </NativeUiText>
          <NativeUiText
            style={styles.txt}
            fontSize={12}
            textColor={THEME.COLORS.SECONDARY_TEXT}
          >
            alicendeh16@gmail.com
          </NativeUiText>
          <NativeUiText
            style={styles.txt}
            fontSize={12}
            textColor={THEME.COLORS.SECONDARY_TEXT}
          >
            +233675979594
          </NativeUiText>
          <NativeUiText
            style={styles.txt}
            fontSize={12}
            textColor={THEME.COLORS.PRIMARY_TEAL}
            textType={'medium'}
          >
            CREATOR
          </NativeUiText>
        </View>
      </View>

      <View style={styles.cardContainer}>
        {USER_DETAILS.map((item) => (
          <View style={[styles.card, DefaultStyles.containerCenter]}>
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
          fontSize={THEME.FONT_SIZE.SMALL}
          style={styles.aboutText}
          textColor={THEME.COLORS.SECONDARY_TEXT}
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus
          semper nisl sed rhoncus rutrum. In vulputate sem at elit cursus
          venenatis. Vestibulum eget molestie massa. Nunc
        </NativeUiText>
      </View>
    </ScrollView>
  );
};

export default About;
