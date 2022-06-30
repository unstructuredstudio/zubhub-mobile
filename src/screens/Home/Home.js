import { FlatList, SafeAreaView } from 'react-native';
import { NativeUiHeader, ProjectCard } from '@components/';
import React from 'react';
import styles from './Home.style';
import { CARD_DATA_SET } from '../../data';
import DefaultStyles from '../../constants/DefaultStyles.style';

const Home = () => {
  return (
    <SafeAreaView style={styles.container}>
      <NativeUiHeader />
      <FlatList
        contentContainerStyle={[styles.list, DefaultStyles.containerCenter]}
        data={CARD_DATA_SET}
        keyExtractor={(_, index) => index}
        renderItem={({ item }) => (
          <ProjectCard
            image={item.image}
            title={item.title}
            desc={item.desc}
            AuthorName={item.AuthorName}
            role={item.role}
            avater={item.avater}
            timeline={item.timeline}
            NOV={item.NOV}
            clap={item.clap}
            messages={item.messages}
          />
        )}
      />
    </SafeAreaView>
  );
};

export default Home;
