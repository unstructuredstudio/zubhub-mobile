import React from "react";
import { ScrollView, View, TouchableOpacity } from "react-native";
import { NativeUiText, Avater } from "@components/";
import styles from "./About.style";
import { USER_DETAILS } from "../../data";
import DefaultStyles from "../../constants/DefaultStyles.style";
import * as THEME from "../../constants/theme";
import { useNavigation } from "@react-navigation/native";

const About = ({ user }) => {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <View style={DefaultStyles.containerRow}>
        <Avater
          width={67}
          height={67}
          uri={require("@asset/avater.jpg")}
          radius={15}
        />
        <View style={styles.userDetails}>
          <NativeUiText fontSize={THEME.FONT_SIZE.SMALL} textType={"medium"}>
            {user?.username}
          </NativeUiText>
          <NativeUiText
            style={styles.txt}
            fontSize={12}
            textColor={THEME.COLORS.SECONDARY_TEXT}
          >
            {user?.email}
          </NativeUiText>
          <NativeUiText
            style={styles.txt}
            fontSize={12}
            textColor={THEME.COLORS.SECONDARY_TEXT}
          >
            {user?.phone}
          </NativeUiText>
          <NativeUiText
            style={styles.txt}
            fontSize={12}
            textColor={THEME.COLORS.PRIMARY_TEAL}
            textType={"medium"}
          >
            {user?.tags[0]}
          </NativeUiText>
        </View>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate("UsersProjects")}
          style={[styles.card, DefaultStyles.containerCenter]}
        >
          <NativeUiText textType="medium">{user?.projects_count} </NativeUiText>
          <NativeUiText textType="bold">Projects </NativeUiText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Bookmark")}
          style={[styles.card, DefaultStyles.containerCenter]}
        >
          <NativeUiText textType="bold">Bookmarks </NativeUiText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("UsersFollowers")}
          style={[styles.card, DefaultStyles.containerCenter]}
        >
          <NativeUiText textType="medium">
            {user?.followers?.length}
          </NativeUiText>
          <NativeUiText textType="bold">Followers </NativeUiText>
        </TouchableOpacity>

        <View style={[styles.card, DefaultStyles.containerCenter]}>
          <NativeUiText textType="medium">
            {user?.following_count}{" "}
          </NativeUiText>
          <NativeUiText textType="bold">Following </NativeUiText>
        </View>
      </View>

      <View style={styles.aboutSection}>
        <NativeUiText fontSize={THEME.FONT_SIZE.MEDIUM} textType={"medium"}>
          About Me
        </NativeUiText>
        <NativeUiText
          style={styles.aboutText}
          textColor={THEME.COLORS.SECONDARY_TEXT}
        >
          {user?.bio}
        </NativeUiText>
      </View>
    </ScrollView>
  );
};

export default About;
