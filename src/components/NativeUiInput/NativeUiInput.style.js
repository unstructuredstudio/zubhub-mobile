import { StyleSheet } from 'react-native';
import * as THEME from '../../constants/theme';

const styles = (textColor) =>
  StyleSheet.create({
    textStyle: {
      color: textColor ? textColor : '#ccc',
      marginBottom: 7,
    },
    smallTextStyle: {
      color: textColor ? textColor : '#ccc',
      fontWeight: '400',
      marginTop: 7,
    },
    textInputStyle: {
      flex: 1,
      paddingVertical: 3,
      height: 55,
    },
    labelItem: {
      marginBottom: 8,
    },
    inputContainer: {
      paddingHorizontal: 15,
      borderRadius: 10,
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
      color: THEME.BLACK,
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
export default styles;
