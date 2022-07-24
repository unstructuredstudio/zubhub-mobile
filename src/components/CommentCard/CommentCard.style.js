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
});

export default styles;
