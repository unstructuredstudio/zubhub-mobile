import React from 'react';
import { View, TextInput, Text, TextStyle, Dimensions } from 'react-native';
import { NativeUiText } from '../../components';
import styles from './NativeUiInput.style';
import DefaultStyles from '../../constants/DefaultStyles.style';
import * as THEME from '../../constants/theme';

const NativeUiInput = (props) => {
  const {
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
  } = props;

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
          <NativeUiText
            style={styles(labelColor).labelItem}
            textColor={THEME.PRIMARY_COLOR}
            textType="bold"
          >
            {label}
          </NativeUiText>
        )}
      </View>

      <View
        style={[
          styles(labelColor).inputContainer,
          {
            width: width ?? '100%',
          },
        ]}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <TextInput
            // {...props}
            keyboardType={inputType}
            onChangeText={onChangeText}
            autoCapitalize={'none'}
            placeholder={placeholder && placeholder}
            placeholderTextColor={placeholderTextColor && placeholderTextColor}
            style={[styles(labelColor).textInputStyle]}
          />
        </View>
        <View>
          {children && (
            <View style={DefaultStyles.containerCenter}>{children}</View>
          )}
        </View>
      </View>
      {bottomText && (
        <NativeUiText style={styles(labelColor).smallTextStyle}>
          {bottomText}
        </NativeUiText>
      )}
    </View>
  );
};

export default NativeUiInput;
