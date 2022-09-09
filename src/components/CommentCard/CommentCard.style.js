import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.COLORS.PRIMARY_GREY,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },

  txt: {
    marginTop: 8,
  },

  authorsDretails: {
    marginHorizontal: 7,
  },

  avaterContainer: {
    width: 45,
    height: 45,
  },

  avater: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: THEME.COLORS.WHITE,
  },
});

export default styles;
