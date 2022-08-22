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
  root: {
    flex: 1,
    // marginTop: StatusBar.currentHeight || 0,
    backgroundColor: '#eaeaea',
  },
  editor: {
    flex: 1,
    padding: 0,

    marginVertical: 5,
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
});

export default styles;
