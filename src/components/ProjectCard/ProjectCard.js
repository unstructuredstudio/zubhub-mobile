import { View, Image, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import styles from './ProjectCard.style';
import { Feather } from '@expo/vector-icons';
import * as THEME from '../../constants/theme';
import RNBounceable from '@freakycoder/react-native-bounceable';
import Fontisto from 'react-native-vector-icons/Fontisto';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { NativeUiText } from '..';

const ProjectCard = ({
  image,
  title,
  desc,
  AuthorName,
  role,
  avater,
  timeline,
  NOV,
  messages,
  clap,
}) => {
  const [bookmark, setBookmark] = useState(false);
  const [clapVal, setclapVal] = useState(false);
  const [shouldUpdateVal, setShouldUpdateVal] = useState(0);

  const toggleBookmark = () => {
    setBookmark(!bookmark);
  };

  const toggleClap = (val) => {
    setclapVal(!clapVal);
  };
  useEffect(() => {
    if (clapVal === true) {
      setShouldUpdateVal(1);
    } else {
      setShouldUpdateVal(0);
    }
  }, [clapVal]);

  return (
    <RNBounceable bounceEffect={0.95} style={styles.mainCard}>
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} />
      </View>
      <View style={styles.cardCOntainer}>
        <View style={styles.iconContainer}>
          <TouchableOpacity
            onPress={() => toggleClap(clap)}
            style={[styles.firstIcon]}
          >
            <MaterialCommunityIcons
              name="hand-clap"
              size={20}
              color={THEME.COLORS.PRIMARY_YELLOW}
            />
            <NativeUiText
              textColor={THEME.COLORS.PRIMARY_YELLOW}
              style={styles.numberOfClaps}
            >
              {shouldUpdateVal ? shouldUpdateVal : clap}
            </NativeUiText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleBookmark}
            style={styles.redContainer}
          >
            {bookmark ? (
              <Fontisto
                name="bookmark-alt"
                size={20}
                color={THEME.COLORS.PRIMARY_YELLOW}
              />
            ) : (
              <Fontisto
                name="bookmark"
                size={20}
                color={THEME.COLORS.PRIMARY_YELLOW}
              />
            )}
          </TouchableOpacity>
        </View>
        <NativeUiText fontSize={THEME.FONT_SIZE.MEDIUM} textType={'bold'}>
          {title}
        </NativeUiText>
        <NativeUiText
          textColor={THEME.COLORS.SECONDARY_TEXT}
          numberOfLines={1}
          style={styles.desc}
        >
          {desc}
        </NativeUiText>
        <View style={DefaultStyles.conainerRow}>
          <View style={styles.avaterContainer}>
            <Image source={avater} style={styles.avater} />
          </View>
          <View style={styles.NativeUiTextContainer}>
            <NativeUiText style={styles.creatorsName}>
              {AuthorName}
            </NativeUiText>
            <NativeUiText
              textColor={THEME.COLORS.PRIMARY_TEAL}
              textType={'medium'}
              fontSize={THEME.FONT_SIZE.SMALL}
            >
              {role}
            </NativeUiText>
          </View>
        </View>

        <View style={DefaultStyles.conainerRow}>
          <View style={styles.avaterContainer}></View>
          <View style={styles.lastItems}>
            <View style={DefaultStyles.conainerRow}>
              <View style={DefaultStyles.conainerRow}>
                <Feather
                  name="eye"
                  size={15}
                  color={THEME.COLORS.SECONDARY_TEXT}
                />
                <NativeUiText
                  textColor={THEME.COLORS.SECONDARY_TEXT}
                  style={styles.txt}
                >
                  {NOV}{' '}
                </NativeUiText>
              </View>
              <View style={[DefaultStyles.conainerRow, styles.secondIconViea]}>
                <Feather
                  name="message-square"
                  size={15}
                  color={THEME.COLORS.SECONDARY_TEXT}
                />
                <NativeUiText
                  textColor={THEME.COLORS.SECONDARY_TEXT}
                  style={styles.txt}
                >
                  {messages}{' '}
                </NativeUiText>
              </View>
            </View>
            <View>
              <NativeUiText
                textColor={THEME.COLORS.SECONDARY_TEXT}
                style={styles.txt}
                fontSize={THEME.FONT_SIZE.SMALL}
                textType={'medium'}
              >
                {timeline}{' '}
              </NativeUiText>
            </View>
          </View>
        </View>
      </View>
    </RNBounceable>
  );
};

export default ProjectCard;
