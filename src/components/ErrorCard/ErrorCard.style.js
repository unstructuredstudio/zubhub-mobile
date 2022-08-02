import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';

const styles = StyleSheet.create({
  main: {
    backgroundColor: 'rgba(250, 186, 186, 0.2)',
    marginTop: 15,
    borderRadius: 12,
    paddingVertical: 21,
    paddingHorizontal: 12,
  },

  errorBox: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  bullet: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: THEME.COLORS.PRIMARY_RED,
    marginRight: 12,
  },
});

export default styles;
