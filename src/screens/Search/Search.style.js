import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';
import { COLORS } from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE,
  },

  list: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  searchContainer: {
    shadowColor: THEME.COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.27,
    elevation: 10,
    backgroundColor: THEME.COLORS.WHITE,
    width: THEME.WIDTH * 0.75,
    height: 55,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.SECONDARY_GREY,
  },

  searchBox: {
    shadowColor: THEME.COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.27,
    elevation: 10,
    backgroundColor: THEME.COLORS.PRIMARY_TEAL,
    width: THEME.WIDTH * 0.15,
    height: 55,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.SECONDARY_GREY,
    justifyContent: 'center',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    marginHorizontal: 0,
  },

  inputContainer: {
    flexDirection: 'row',
  },

  icon: {
    alignSelf: 'center',
    marginHorizontal: 10,
  },

  img: {
    width: 100,
    height: 100,
  },

  mainContainer: {
    marginTop: 22,
  },

  txt: {
    marginTop: 32,
    textAlign: 'center',
  },

  notFoundImage: {
    width: 300,
    height: 300,
    alignSelf: 'center',
  },
});

export default styles;
