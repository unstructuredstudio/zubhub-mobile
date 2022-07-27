import {
  View,
  Image,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import styles from './ProjectCard.style';
import { Feather } from '@expo/vector-icons';
import * as THEME from '../../constants/theme';
import Fontisto from 'react-native-vector-icons/Fontisto';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { NativeUiText, NativeUiActionSheet, NativeUiButton } from '..';
import { SheetManager } from 'react-native-actions-sheet';
import { useNavigation } from '@react-navigation/native';
import { dFormatter, buildVideoThumbnailURL } from '../../utils/script';
import AntDesign from 'react-native-vector-icons/AntDesign';
import RenderHtml from 'react-native-render-html';

const ProjectCard = ({ item }) => {
  const navigation = useNavigation();

  const {
    description,
    images,
    title,
    creator,
    created_on,
    views_count,
    clap,
    comments_count,
    video,
  } = item;

  const [bookmark, setBookmark] = useState(false);
  const [clapVal, setclapVal] = useState(false);
  const [shouldUpdateVal, setShouldUpdateVal] = useState(0);

  const toggleBookmark = () => {
    SheetManager.show('authenticationSheet');
  };

  const toggleClap = (val) => {
    SheetManager.show('authenticationSheet');
  };
  useEffect(() => {
    if (clapVal === true) {
      setShouldUpdateVal(1);
    } else {
      setShouldUpdateVal(0);
    }
  }, [clapVal]);

  const { width } = useWindowDimensions();

  return (
    <TouchableOpacity
      bounceEffect={0.95}
      style={styles.mainCard}
      onPress={() => navigation.navigate('ProjectDetail', { item })}
    >
      <NativeUiActionSheet id="authenticationSheet" sheetTitle="Create Account">
        <NativeUiText style={styles.space}>
          Lets create an account for you first! so you can bookmark this project
        </NativeUiText>
        <NativeUiButton
          onPress={async () => {
            navigation.navigate('Register');
            await SheetManager.hide('authenticationSheet');
          }}
          label={'Create Account'}
          style={styles.space}
        />
      </NativeUiActionSheet>

      <View style={styles.imageContainer}>
        {images.length > 0 ? (
          <Image
            source={{
              uri: images[0].image_url,
            }}
            style={styles.image}
          />
        ) : (
          <>
            <Image
              source={{
                uri: buildVideoThumbnailURL(video),
              }}
              style={styles.image}
            />
            <View style={[styles.videoIcon, DefaultStyles.containerCenter]}>
              <AntDesign
                name="youtube"
                size={102}
                color={THEME.COLORS.PRIMARY_TEAL}
              />
            </View>
          </>
        )}
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
          {description}
        </NativeUiText>

        <View style={DefaultStyles.containerRow}>
          <View style={styles.avaterContainer}>
            <Image source={{ uri: creator.avatar }} style={styles.avater} />
          </View>
          <View style={styles.NativeUiTextContainer}>
            <NativeUiText style={styles.creatorsName}>
              {creator.username}
            </NativeUiText>
            <NativeUiText
              textColor={THEME.COLORS.PRIMARY_TEAL}
              textType={'medium'}
              fontSize={THEME.FONT_SIZE.SMALL}
              style={styles.role}
            >
              {creator.tags[0]}
            </NativeUiText>
          </View>
        </View>

        <View style={DefaultStyles.containerRow}>
          <View style={styles.avaterContainer}></View>

          <View style={styles.lastItems}>
            <View style={DefaultStyles.containerRow}>
              <View style={DefaultStyles.containerRow}>
                <Feather
                  name="eye"
                  size={15}
                  color={THEME.COLORS.SECONDARY_TEXT}
                />
                <NativeUiText
                  textColor={THEME.COLORS.SECONDARY_TEXT}
                  style={styles.txt}
                >
                  {views_count}
                </NativeUiText>
              </View>
              <View style={[DefaultStyles.containerRow, styles.secondIconViea]}>
                <Feather
                  name="message-square"
                  size={15}
                  color={THEME.COLORS.SECONDARY_TEXT}
                />
                <NativeUiText
                  textColor={THEME.COLORS.SECONDARY_TEXT}
                  style={styles.txt}
                >
                  {comments_count}{' '}
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
                {`${dFormatter(created_on).value}  ${
                  dFormatter(created_on).key
                } ago`}
              </NativeUiText>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProjectCard;
