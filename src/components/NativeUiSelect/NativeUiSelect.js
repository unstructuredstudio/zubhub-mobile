import { View } from 'react-native';
import React from 'react';
import styles from './NativeUiSelect.style';
import { Entypo } from '@expo/vector-icons';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { NativeUiText } from '@components/';
import SelectDropdown from 'react-native-select-dropdown';

const NativeUiSelect = ({ data, label }) => {
  return (
    <View>
      <View>
        {label && (
          <NativeUiText style={styles.labelItem} textType="medium">
            {label}
          </NativeUiText>
        )}
      </View>
      <View style={[styles.inputContainer]}>
        <View style={styles.dropdown}>
          <SelectDropdown
            dropdownStyle={styles.dropdownOverlay}
            buttonTextStyle={styles.btnText}
            buttonStyle={styles.textInputStyle}
            data={data}
            onSelect={(selectedItem, index) => {
              console.log(selectedItem, index);
            }}
            buttonTextAfterSelection={(selectedItem, index) => {
              return selectedItem;
            }}
            rowTextForSelection={(item, index) => {
              return item;
            }}
          />
        </View>
        <View style={DefaultStyles.containerCenter}>
          <Entypo name="chevron-down" size={22} color="black" />
        </View>
      </View>
    </View>
  );
};

export default NativeUiSelect;
