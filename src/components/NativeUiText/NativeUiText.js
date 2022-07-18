import React from 'react';
import { Text } from 'react-native';

const NativeUiText = ({
  children,
  textType = 'regular',
  style,
  textColor,
  fontSize = 14,
  numberOfLines,
}) => {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        style,
        {
          fontSize: fontSize && fontSize,
          color: textColor && textColor,
          fontWeight:
            textType === 'light'
              ? '100'
              : textType === 'regular'
              ? 'normal'
              : textType === 'medium'
              ? '500'
              : textType === 'semiBold'
              ? '700'
              : textType === 'bold' && 'bold',
        },
      ]}
    >
      {children}
    </Text>
  );
};

export default NativeUiText;
