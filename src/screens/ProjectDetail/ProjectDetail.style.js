import { StyleSheet } from "react-native";
import layout from "../../constants/layout";
import * as THEME from "../../constants/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE,
  },

  topContainer: {
    marginVertical: 21,
    flex: 1,
    paddingHorizontal: 16,
  },

  imgConainer: {
    width: 111,
    height: 21,
  },

  img: {
    width: "100%",
    height: "100%",
  },

  avaterContainer: {
    width: 45,
    height: 45,
  },

  avater: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    backgroundColor: THEME.COLORS.PRIMARY_YELLOW,
  },

  userProfile: {
    marginTop: 17,
  },

  authorDetails: {
    marginLeft: 12,
  },

  follow: {
    backgroundColor: THEME.COLORS.PRIMARY_TEAL,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 21,
  },

  mainImageContainer: {
    height: 188,
    marginTop: 22,
    width: "100%",
  },

  leftCard: {
    backgroundColor: THEME.COLORS.PRIMARY_TEAL,
    height: 130,
    width: 30,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },

  rightCard: {
    backgroundColor: THEME.COLORS.PRIMARY_TEAL,
    height: 130,
    width: 30,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    // position: 'absolute',
    // right: 0,
  },

  imageSlide: {
    // width: '90%',
    height: 130,

    flex: 1,
  },

  individualImageSlider: {
    width: 100,
    height: 130,
    borderRadius: 7,
    marginHorizontal: 12,
  },

  clickable: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 60,
    right: 40,
  },

  userProfilex: {
    flexDirection: "row",
    marginTop: 21,
  },

  imageContainer: {
    flex: 1,
  },

  fullImage: {
    width: "100%",
    height: 400,
  },

  webView: {
    flex: 1,
    backgroundColor: "red",
    height: 200,
    marginTop: 12,
  },

  materialContainer: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: THEME.COLORS.PRIMARY_TEAL,
    paddingVertical: 12,
    paddingHorizontal: 7,
    margin: 12,
  },

  materialPrimary: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});

export default styles;
