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

  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.COLORS.PRIMARY_GREEN,
  },

  line: {
    width: 30,
    height: 5,
    backgroundColor: THEME.COLORS.PRIMARY_GREEN,
    marginLeft: 12,
    flex: 1,
  },

  box: {
    width: THEME.WIDTH / 3,
    marginRight: 10,
  },

  step: {
    marginLeft: 7,
    marginTop: 4,
  },

  bottomContainer: {
    marginHorizontal: 15,
    paddingBottom: 12,
  },

  wizard: {
    marginBottom: 10,
  },

  inputContainer: {
    paddingRight: 15,
    borderRadius: 10,
    backgroundColor: THEME.COLORS.WHITE,
    shadowColor: '#ccc',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2.22,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#eee',
    fontWeight: 'bold',
    color: THEME.COLORS.BLACK,
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    paddingHorizontal: 12,
  },

  dropdown: {
    width: '100%',
  },

  arrow: {
    position: 'absolute',
    right: 0,
    marginRight: 12,
  },

  location: {
    marginBottom: 8,
  },
});

export default styles;
