import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { NativeUiText } from '../../components';
import styles from './NativeUiInput.style';
import DefaultStyles from '../../constants/DefaultStyles.style';
import * as THEME from '../../constants/theme';
import Entypo from 'react-native-vector-icons/Entypo';
import { useTranslation } from 'react-i18next';

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
  password,
}) => {
  const inputType = email
    ? 'email-address'
    : number
    ? 'numeric'
    : phone
    ? 'phone-pad'
    : 'default';
  const [showPassword, setShowPassword] = useState(true);
  const { t } = useTranslation();

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
        <View style={styles(labelColor).itemView}>
          <TextInput
            onBlur={onBlur}
            keyboardType={inputType}
            onChangeText={onChangeText}
            autoCapitalize={'none'}
            placeholder={placeholder && placeholder}
            placeholderTextColor={placeholderTextColor && placeholderTextColor}
            style={[styles(labelColor).textInputStyle]}
            multiline={multiline}
            secureTextEntry={password && showPassword && true}
          />
          {password && (
            <TouchableOpacity
              style={DefaultStyles.containerCenter}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Entypo
                name={showPassword ? 'eye-with-line' : 'eye'}
                color={THEME.COLORS.SECONDARY_TEXT}
                size={20}
              />
            </TouchableOpacity>
          )}
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
          {t(error)}
        </NativeUiText>
      )}
    </View>
  );
};

export default NativeUiInput;
