import { StyleSheet, Dimensions } from 'react-native';
import * as THEME from '../../constants/theme';

const WIDTH = Dimensions.get('screen').width;

const style = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 22,
    backgroundColor: THEME.COLORS.WHITE,
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
    // justifyContent: 'space-around',
    alignItems: 'center',
  },
  skipColor: {
    color: 'brown',
    fontWeight: 'bold',
  },
  heading: {
    fontSize: 22,
    textAlign: 'center',
    // paddingVertical: 7,
    marginTop: 30,
    lineHeight: 32,
  },
  body: {
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 30,
  },
  annimView: {
    width: 360,
    height: 360,
  },
  iconView: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: THEME.COLORS.PRIMARY_TEAL,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },

  rightIcon: {
    elevation: 12,
    backgroundColor: THEME.COLORS.PRIMARY_TEAL,
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

  img: {
    width: '100%',
    height: '100%',
  },
});

export default style;
