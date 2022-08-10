import { StyleSheet } from "react-native";

const DefaultStyles = StyleSheet.create({
  container: {
    flex: 1,
  },

  containerCenter: {
    justifyContent: "center",
    alignItems: "center",
  },

  containerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  containerSpaced: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

export default DefaultStyles;
