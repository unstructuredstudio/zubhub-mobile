import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: THEME.COLORS.PRIMARY_RED,
    paddingVertical: 7,
    paddingHorizontal: 16,
    shadowColor: THEME.COLORS.PRIMARY_RED,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,

    elevation: 10,
  },

  imgConainer: {
    width: 111,
    height: 21,
  },

  img: {
    width: '100%',
  },

  spacing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  icon: {
    marginHorizontal: 14,
  },
});

export default styles;
