import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    width: '95%',
    backgroundColor: '#860A0A',
    flexDirection: 'row',
    borderRadius: 10,
  },

  leftBox: {
    width: 10,
    backgroundColor: '#B82222',
    borderRadius: 10,
    marginRight: 21,
  },

  textContainer: {
    marginVertical: 10,
  },

  errorText: {
    marginVertical: 6,
  },

  desc: {
    width: '70%',
  },
});

export default styles;
