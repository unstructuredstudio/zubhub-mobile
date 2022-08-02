import { View, Image } from 'react-native';
import React from 'react';
import Modal from 'react-native-modal';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { NativeUiText, NativeUiButton } from '..';
import * as THEME from '../../constants/theme';
import styles from './NativeUiModal.style';

const NativeUiModal = ({ visible, setVisible, navigation }) => {
  return (
    <View>
      <Modal onBackdropPress={() => setVisible(false)} isVisible={visible}>
        <View style={styles.container}>
          <View style={[DefaultStyles.containerCenter, styles.main]}>
            <View style={styles.modalContainer}>
              <View style={styles.imgContainer}>
                <Image
                  style={styles.img}
                  source={require('../../../assets/good.png')}
                />
              </View>
            </View>
            <View style={[DefaultStyles.containerCenter, styles.congrats]}>
              <NativeUiText fontSize={18}>Congratulations!</NativeUiText>
              <NativeUiText
                textColor={THEME.COLORS.SECONDARY_TEXT}
                style={styles.successText}
              >
                Your account was successfully created. Welcome onboard!
              </NativeUiText>
            </View>
          </View>
          <View style={styles.btnContainer}>
            <NativeUiButton
              onPress={() => {
                setVisible(false);
                navigation.replace('BottomNavigator');
              }}
              label={'Go to Home'}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default NativeUiModal;
