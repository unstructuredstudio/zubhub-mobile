import React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import ActionSheet, { SheetManager } from 'react-native-actions-sheet';
import { View } from 'react-native';
import { NativeUiText } from '@components/';
import DefaultStyles from '../../constants/DefaultStyles.style';
import * as THEME from '../../constants/theme';
import styles from './NativeUiActionSheet.style';
import Entypo from 'react-native-vector-icons/Entypo';

const NativeUiActionSheet = ({ children, id, sheetTitle }) => {
  return (
    <ActionSheet id={id}>
      <View
        style={[
          DefaultStyles.containerSpaced,
          styles.topContainer,
          styles.main,
        ]}
      >
        <View />
        <NativeUiText fontSize={THEME.FONT_SIZE.MEDIUM} textType="medium">
          {sheetTitle}
        </NativeUiText>
        <TouchableOpacity onPress={async () => await SheetManager.hide(id)}>
          <Entypo
            name="circle-with-cross"
            size={28}
            color={THEME.COLORS.PRIMARY_RED}
          />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.main}>{children}</View>
      </ScrollView>
    </ActionSheet>
  );
};

export default NativeUiActionSheet;
