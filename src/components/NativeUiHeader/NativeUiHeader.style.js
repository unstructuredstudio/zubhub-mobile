import { StyleSheet } from 'react-native';
import layout from '../../constants/layout';
import * as THEME from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
  },
  headerContainer: {
    backgroundColor: THEME.COLORS.PRIMARY_RED,
    paddingVertical: 7,
    shadowColor: THEME.COLORS.PRIMARY_RED,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.34,
    shadowRadius: 6.27,

    elevation: 10,
  },

  header: {
    height: 44,
    width: 55,
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

  sectionTitleContainer: {
    width: layout.window.width - 110,
  },
});

export default styles;
