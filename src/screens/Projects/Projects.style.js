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

  categoryText: {
    marginBottom: 8,
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

  dropdown: {
    flex: 1,
  },

  dropdownContainer: {
    marginBottom: 21,
    height: 55,
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
    borderRadius: 10,
    paddingHorizontal: 15,
  },

  categoryView: {
    backgroundColor: THEME.COLORS.SECONDARY_GREY,
    marginTop: 22,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 14,
  },

  categoryBox: {
    marginBottom: 55,
  },

  imgAdded: {
    marginTop: 8,
    fontStyle: 'italic',
  },

  roleText: {
    fontStyle: 'italic',
  },

  title: {
    fontWeight: 'bold',
    alignSelf: 'center',
    paddingVertical: 10,
  },

  editor: {
    flex: 1,
    padding: 0,

    marginVertical: 12,
    backgroundColor: 'white',
    width: '100%',
    // height: 55,
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
    borderRadius: 10,
    paddingHorizontal: 15,
  },

  optionContainer: {
    width: THEME.WIDTH * 0.9,
    borderRadius: 32,
    height: 50,
    borderWidth: 2,
    borderColor: THEME.COLORS.PRIMARY_TEAL,
    backgroundColor: THEME.COLORS.WHITE,
    flexDirection: 'row',
    marginTop: 22,
    paddingHorizontal: 3,
  },
  defaultOption: {
    backgroundColor: THEME.COLORS.PRIMARY_TEAL,
    width: THEME.WIDTH * 0.43,
    borderRadius: 22,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },

  unselectedOption: {
    width: THEME.WIDTH * 0.44,
    borderRadius: 22,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },

  onSelectInput: {
    marginTop: 22,
  },

  elemHeight: {
    height: 55,
  },

  cancelContainer: {
    borderWidth: 1,
    borderColor: THEME.COLORS.PRIMARY_TEAL,
    borderRadius: 9,
    height: 42,
    width: THEME.WIDTH * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  uploadContainer: {
    height: 42,
    width: THEME.WIDTH * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.PRIMARY_TEAL,
    borderRadius: 9,
  },
});

export default styles;
