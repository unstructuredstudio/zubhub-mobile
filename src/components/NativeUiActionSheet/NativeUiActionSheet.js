import React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import ActionSheet, { SheetManager } from 'react-native-actions-sheet';
import { View } from 'react-native';
import { NativeUiText } from '@components/';
import DefaultStyles from '../../constants/DefaultStyles.style';
import * as THEME from '../../constants/theme';
import styles from './NativeUiActionSheet.style';
import Entypo from 'react-native-vector-icons/Entypo';
import RNBounceable from '@freakycoder/react-native-bounceable';

const NativeUiActionSheet = ({ children, id, sheetTitle }) => {
  return (
    <ActionSheet containerStyle={styles.main} id={id}>
      <View style={[DefaultStyles.containerSpaced, styles.topContainer]}>
        <View />
        <NativeUiText fontSize={THEME.FONT_SIZE.MEDIUM} textType="medium">
          {sheetTitle}
        </NativeUiText>
        <RNBounceable onPress={async () => await SheetManager.hide(id)}>
          <Entypo
            name="circle-with-cross"
            size={28}
            color={THEME.COLORS.PRIMARY_RED}
          />
        </RNBounceable>
      </View>
      <ScrollView style={styles.container}>{children}</ScrollView>
    </ActionSheet>
  );
};

export default NativeUiActionSheet;
