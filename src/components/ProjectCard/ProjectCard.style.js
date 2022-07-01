import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';
import layout from '../../constants/layout';

const style = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },

  container: {
    paddingHorizontal: 15,
    paddingBottom: 12,
    flex: 1,
  },

  mainCard: {
    marginBottom: 25,
  },

  imageContainer: {
    width: layout.window.width * 0.9,
    height: 188,
  },

  image: {
    width: '100%',
    borderTopRightRadius: 15,
    borderTopLeftRadius: 15,
  },

  redContainer: {
    backgroundColor: THEME.COLORS.PRIMARY_RED,
    width: 30,
    height: 30,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  firstIcon: {
    marginRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.PRIMARY_RED,
    width: 40,
    height: 30,
    borderRadius: 20,
  },

  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -17,
    marginRight: 12,
  },
  cardCOntainer: {
    backgroundColor: THEME.COLORS.PRIMARY_GREY,
    borderBottomRightRadius: 15,
    borderBottomLeftRadius: 14,
    width: layout.window.width * 0.9,
    paddingHorizontal: 12,
  },

  desc: {
    color: THEME.COLORS.PRIMARY_TEXT,
    width: layout.window.width * 0.8,
    marginVertical: 12,
  },

  txt: {
    color: THEME.COLORS.PRIMARY_TEXT,
    fontSize: 11,
  },

  avaterContainer: {
    width: 45,
    height: 45,
  },

  avater: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },

  textContainer: {
    marginLeft: 7,
  },

  creatorsName: {
    fontWeight: 'bold',
  },

  lastItems: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 12,
  },

  secondIconViea: {
    marginLeft: 12,
  },

  NativeUiTextContainer: {
    marginLeft: 7,
  },

  space: {
    marginTop: 22,
  },
});

export default style;
