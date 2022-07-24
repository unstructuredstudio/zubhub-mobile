import { SafeAreaView, View, TouchableOpacity } from 'react-native';
import { NativeUiHeader, NativeUiText, ProjectCard } from '@components/';
import React, { useState } from 'react';
import styles from './Profile.style';
import { TAB_DATA_SET } from '../../data';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { About, Comments, Setting } from '@screens/';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('About');

  const aboutData = {
    authorsName: 'Alice Ndeh',
    authorsEmail: 'alicendeh16@gmail.com',
    authorsNumber: '+237675979594',
    authorsTag: 'CREATOR',
    NoP: 7,
    NoB: 2,
    NoF: 24,
    following: 12,
    bio: '   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus semper nisl sed rhoncus rutrum. In vulputate sem at elit cursus  venenatis. Vestibulum eget molestie massa. Nunc',
  };

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
                {item.title}
              </NativeUiText>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.container}>
          {activeTab === 'About' ? (
            <About aboutData={aboutData} />
          ) : activeTab === 'Comments' ? (
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
