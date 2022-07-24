import React from 'react';
import { View, TextInput } from 'react-native';
import { NativeUiText } from '../../components';
import styles from './NativeUiInput.style';
import DefaultStyles from '../../constants/DefaultStyles.style';
import * as THEME from '../../constants/theme';

const NativeUiInput = ({
  label,
  labelColor = '#ccc',
  placeholder,
  placeholderTextColor = '#A8A8A8',
  onChangeText,
  number,
  phone,
  email,
  bottomText,
  children,
  width,
  multiline,
  error,
  onBlur,
}) => {
  const inputType = email
    ? 'email-address'
    : number
    ? 'numeric'
    : phone
    ? 'phone-pad'
    : 'default';
  return (
    <View>
      <View>
        {label && (
          <NativeUiText style={styles(labelColor).labelItem} textType="medium">
            {label}
          </NativeUiText>
        )}
      </View>

      <View
        style={[
          styles(labelColor).inputContainer,
          {
            width: width ?? '100%',
            height: multiline ? 120 : 55,
          },
        ]}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <TextInput
            onBlur={onBlur}
            keyboardType={inputType}
            onChangeText={onChangeText}
            autoCapitalize={'none'}
            placeholder={placeholder && placeholder}
            placeholderTextColor={placeholderTextColor && placeholderTextColor}
            style={[styles(labelColor).textInputStyle]}
            multiline={multiline}
          />
        </View>
        <View>
          {children && (
            <View style={DefaultStyles.containerCenter}>{children}</View>
          )}
        </View>
      </View>
      {bottomText && (
        <NativeUiText
          fontSize={12}
          textColor={THEME.COLORS.SECONDARY_TEXT}
          style={styles(labelColor).smallTextStyle}
        >
          {bottomText}
        </NativeUiText>
      )}
      {error && (
        <NativeUiText
          textColor={THEME.COLORS.PRIMARY_RED}
          style={styles(labelColor).errorText}
        >
          {error}
        </NativeUiText>
      )}
    </View>
  );
};

export default NativeUiInput;
