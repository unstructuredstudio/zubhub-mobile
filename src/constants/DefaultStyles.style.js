import { StyleSheet } from 'react-native';

const DefaultStyles = StyleSheet.create({
  container: {
    flex: 1,
  },

  containerCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  containerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  containerSpaced: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  avaterContainer: {
    width: 45,
    height: 45,
  },

  avater: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#fff',
  },
});

export default DefaultStyles;
