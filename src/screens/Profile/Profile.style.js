import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE,
  },

  main: {
    paddingHorizontal: 15,
    paddingTop: 17,
    flex: 1,
  },
});

export default styles;
