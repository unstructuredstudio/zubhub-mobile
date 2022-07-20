import { StyleSheet } from 'react-native';
import layout from '../../constants/layout';
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
    width: layout.window.width / 3,
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

  imageContainer: {
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderColor: THEME.COLORS.PRIMARY_GREY,
    marginTop: 8,
  },

  details: {
    marginVertical: 8,
  },

  txt: {
    marginLeft: 9,
  },
  materialsText: {
    marginBottom: 7,
  },

  materialInput: {
    marginTop: 8,
  },

  addMore: {
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderColor: '#BEBEBE',
  },
});

export default styles;
