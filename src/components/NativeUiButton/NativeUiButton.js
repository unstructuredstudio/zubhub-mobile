import React from 'react';
import { TouchableOpacity, View, ActivityIndicator } from 'react-native';
import * as THEME from '../../constants/theme';
import { NativeUiText } from '../../components';
import DefaultStyles from '../../constants/DefaultStyles.style';

export const NativeUiButton = ({
  label,
  onPress,
  btnColor = THEME.COLORS.PRIMARY_TEAL,
  style,
  textColor = THEME.COLORS.WHITE,
  btnWidth = '100%',
  btnRadius = 10,
  borderWidth = 0,
  borderColor,
}) => {
  return (
    <View>
      <TouchableOpacity onPress={onPress}>
        <View
          style={[
            {
              backgroundColor: btnColor,
              borderRadius: btnRadius,
              width: btnWidth,
              height: 55,
              borderWidth: borderWidth,
              borderColor: borderColor,
            },
            style,
            DefaultStyles.containerCenter,
          ]}
        >
          <NativeUiText fontSize={16} textColor={textColor} textType={'bold'}>
            {label}
          </NativeUiText>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default NativeUiButton;
