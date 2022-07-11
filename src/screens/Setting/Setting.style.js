import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';

const styles = StyleSheet.create({
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 7,
    backgroundColor: 'rgba(80, 181, 194, 0.5)',
  },

  info: {
    marginHorizontal: 12,
  },
  txt: {
    marginTop: 4,
  },

  card: {
    marginTop: 27,
  },

  circle: {
    width: 15,
    height: 15,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.COLORS.PRIMARY_TEXT,
  },

  itemElement: {
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.COLORS.SECONDARY_GREY,
    paddingVertical: 12,
  },

  itemElement1: {
    borderBottomWidth: 1,
    borderColor: THEME.COLORS.SECONDARY_GREY,
    marginBottom: 21,
    paddingVertical: 12,
  },
});

export default styles;
