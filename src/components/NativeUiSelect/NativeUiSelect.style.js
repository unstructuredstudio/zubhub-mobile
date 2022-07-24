import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';

const styles = StyleSheet.create({
  textStyle: {
    color: THEME.COLORS.PRIMARY_TEXT,
    marginBottom: 7,
  },
  smallTextStyle: {
    color: THEME.COLORS.PRIMARY_TEXT,
    fontWeight: '400',
    marginTop: 7,
  },
  textInputStyle: {
    flex: 1,
    paddingVertical: 3,
    backgroundColor: THEME.COLORS.WHITE,
    width: '100%',
    justifyContent: 'flex-start',
  },
  labelItem: {
    marginBottom: 8,
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
    color: THEME.BLACK,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdown: {
    flex: 1,
  },

  btnText: {
    textAlign: 'left',
    fontSize: 15,
  },

  dropdownOverlay: {
    borderRadius: 7,
    marginTop: 21,
  },
});
export default styles;
