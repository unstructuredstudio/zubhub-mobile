import { FlatList, SafeAreaView } from 'react-native';
import { NativeUiHeader, ProjectCard } from '@components/';
import React, { useState, useEffect } from 'react';
import styles from './Home.style';
import { CARD_DATA_SET } from '../../data';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { getAllProjects } from '../../redux/actions/projectsAction';
import { useSelector, useDispatch } from 'react-redux';

const Home = () => {
  const dispatch = useDispatch();

  const projects = useSelector((state) => state.projects);
  useEffect(() => {
    fetchAllProjects();
  }, []);

  console.log(projects, 'porodl;');

  const fetchAllProjects = () => {
    dispatch(getAllProjects());
  };

  return (
    <SafeAreaView style={styles.container}>
      <NativeUiHeader />
      <FlatList
        contentContainerStyle={[styles.list, DefaultStyles.containerCenter]}
        data={projects?.allProjects}
        keyExtractor={(_, index) => index}
        renderItem={({ item }) => <ProjectCard item={item} />}
      />
    </SafeAreaView>
  );
};

export default Home;
