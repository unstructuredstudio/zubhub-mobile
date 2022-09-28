import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 21,
  },

  main: {
    marginTop: 21,
  },

  modalContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: THEME.COLORS.PRIMARY_TEAL,
    justifyContent: 'center',
    alignItems: 'center',
  },

  imgContainer: {
    width: 60,
    height: 60,
  },

  img: {
    width: '100%',
    height: '100%',
  },

  congrats: {
    marginTop: 21,
  },

  btnContainer: {
    marginVertical: 21,
    marginHorizontal: 16,
  },

  successText: {
    marginTop: 12,
    textAlign: 'center',
  },
});

export default styles;
