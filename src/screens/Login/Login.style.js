import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 12,
  },

  wizard: {
    marginBottom: 10,
  },

  forgetPwd: {
    alignItems: 'flex-end',
    marginRight: 21,
  },
});

export default styles;
