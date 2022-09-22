import { SafeAreaView, View, TouchableOpacity } from 'react-native';
import { NativeUiHeader, NativeUiText, ProjectCard } from '@components/';
import React, { useState, useEffect } from 'react';
import styles from './Profile.style';
import { TAB_DATA_SET } from '../../data';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { About, Comments, Setting } from '@screens/';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('general.about');
  const user = useSelector((state) => state.user);
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <NativeUiHeader />
      <View style={styles.main}>
        <View style={[DefaultStyles.containerSpaced, styles.cardContainer]}>
          {TAB_DATA_SET.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.card,
                {
                  backgroundColor: activeTab === item.title ? '#000' : '#fff',
                },
              ]}
              onPress={() => setActiveTab(item.title)}
            >
              <NativeUiText
                textType="medium"
                textColor={activeTab === item.title ? '#fff' : '#000'}
                fontSize={16}
              >
                {t(item.title)}
              </NativeUiText>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.container}>
          {activeTab === 'general.about' ? (
            <About user={user?.user} />
          ) : activeTab === 'general.comments' ? (
            <Comments />
          ) : (
            <Setting />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
