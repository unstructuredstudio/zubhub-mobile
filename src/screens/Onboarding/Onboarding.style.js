import { StyleSheet, Dimensions } from 'react-native';
import * as THEME from '../../constants/theme';

const WIDTH = Dimensions.get('screen').width;

const style = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 22,
    backgroundColor: THEME.COLORS.PRIMARY_RED,
  },
  skip: {
    alignItems: 'flex-end',
    height: 40,
    paddingHorizontal: 14,
    backgroundColor: '#FAF2E7',
    borderRadius: 70,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    marginHorizontal: 22,
  },
  main: {
    width: WIDTH * 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipColor: {
    color: 'brown',
    fontWeight: 'bold',
  },
  heading: {
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 32,
  },

  body: {
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 30,
  },

  imgConainer: {
    width: 111,
    height: 21,
  },

  img: {
    width: '100%',
  },

  iconView: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.PRIMARY_YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 14,
  },

  rightIcon: {
    elevation: 12,
    backgroundColor: THEME.COLORS.PRIMARY_YELLOW,
  },
  indicatorView: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  indicator: {
    height: 6,
    width: 25,
    backgroundColor: 'grey',
    marginHorizontal: 3,
    borderRadius: 7,
  },

  isLast: {
    display: 'flex',
  },

  diff: {
    display: 'none',
  },

  subtitle: {
    color: '#000',
    fontSize: 13,
    marginTop: 10,
    maxWidth: '70%',
    textAlign: 'center',
    lineHeight: 23,
  },

  title: {
    color: '#000',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
});

export default style;
