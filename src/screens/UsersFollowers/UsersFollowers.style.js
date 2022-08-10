import { StyleSheet } from "react-native";
import * as THEME from "../../constants/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE,
  },

  listItems: {
    marginTop: 17,
    marginRight: 17,
    width: THEME.WIDTH / 2.33,
    backgroundColor: THEME.COLORS.WHITE,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
    alignItems: "center",
    borderRadius: 15,
    paddingVertical: 15,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: THEME.COLORS.PRIMARY_GREY,
  },

  title: {
    marginVertical: 20,
    marginHorizontal: 16,
  },

  imgContainer: {
    width: 80,
    height: 80,
    borderRadius: 60,
    justifyContent: "flex-end",
    backgroundColor: THEME.COLORS.WHITE,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    alignItems: "center",
    marginBottom: 12,
  },

  unfollowContainer: {
    backgroundColor: THEME.COLORS.PRIMARY_TEAL,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignSelf: "baseline",
    borderRadius: 20,
    marginBottom: 12,
  },

  avater: {
    width: 70,
    height: 70,
  },

  unfollow: {
    textTransform: "uppercase",
  },

  list: {
    paddingBottom: 31,
    width: THEME.WIDTH * 0.9,
    alignSelf: "center",
  },
});

export default styles;
