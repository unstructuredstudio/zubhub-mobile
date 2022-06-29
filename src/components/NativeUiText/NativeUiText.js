import React from 'react';
import { Text } from 'react-native';

const NativeUiText = ({
  children,
  textType = 'regular',
  style,
  textColor,
  fontSize = 14,
}) => {
  const passedStyles = Array.isArray(style)
    ? Object.assign({}, ...style)
    : style;

  return (
    <Text
      style={[
        passedStyles,
        {
          fontSize: fontSize,
          color: textColor,
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
