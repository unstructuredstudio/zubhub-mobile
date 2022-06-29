import { StyleSheet } from 'react-native';

const style = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: 41,
  },

  conainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conainerSpaced: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default style;
