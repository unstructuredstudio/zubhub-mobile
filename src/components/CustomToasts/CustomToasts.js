import Toast from 'react-native-toast-message';

export const CustomToasts = ({ type, text, description }) => {
  Toast.show({
    type: type,
    text1: text,
    text2: description,
  });
};
