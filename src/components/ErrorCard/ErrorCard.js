import { View } from 'react-native';
import React, { useEffect } from 'react';
import styles from './ErrorCard.style';
import * as THEME from '../../constants/theme';
import NativeUiText from '../NativeUiText/NativeUiText';
import { useTranslation } from 'react-i18next';

const ErrorCard = ({ error, setError }) => {
  const { t } = useTranslation();

  useEffect(() => {
    setTimeout(() => {
      setError([]);
    }, 5000);
  }, [error]);

  return (
    <View>
      <View style={styles.main}>
        <NativeUiText
          fontSize={16}
          textType={'medium'}
          textColor={THEME.COLORS.PRIMARY_RED}
        >
          {t('general.whatWentWrong')}
        </NativeUiText>
        {error.map((errorMessage, index) => (
          <View key={index} style={styles.errorBox}>
            <View style={styles.bullet}></View>
            <NativeUiText textColor={THEME.COLORS.PRIMARY_RED}>
              {errorMessage}
            </NativeUiText>
          </View>
        ))}
      </View>
    </View>
  );
};

export default ErrorCard;
