import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    // paddingEnd: 15,
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE,
  },

  introContainer: {
    marginVertical: 21,
  },

  topContainer: {
    marginHorizontal: 15,
  },

  createAccount: {
    marginTop: 6,
  },

  input: {
    marginBottom: 21,
  },

  member: {
    marginVertical: 21,
    textAlign: 'center',
  },

  bottomContainer: {
    marginHorizontal: 15,
    paddingBottom: 24,
  },

  wizard: {
    marginBottom: 10,
  },
});

export default styles;
