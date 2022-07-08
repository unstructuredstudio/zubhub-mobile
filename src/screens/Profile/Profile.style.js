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

  card: {
    backgroundColor: THEME.COLORS.BLACK,
    justifyContent: 'center',
    alignItems: 'center',
    height: 34,
    borderRadius: 41,
    paddingHorizontal: 20,
  },

  cardContainer: {
    marginBottom: 22,
  },
});

export default styles;
