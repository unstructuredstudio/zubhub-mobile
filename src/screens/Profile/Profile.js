import { FlatList, SafeAreaView, View } from 'react-native';
import { NativeUiHeader, ProjectCard } from '@components/';
import React from 'react';
import styles from './Profile.style';
import { CARD_DATA_SET } from '../../data';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { About, Comments, Setting } from '@screens/';

const Profile = () => {
  return (
    <SafeAreaView style={styles.container}>
      <NativeUiHeader />
      <View style={styles.main}>
        <Setting />
      </View>
    </SafeAreaView>
  );
};

export default Profile;
