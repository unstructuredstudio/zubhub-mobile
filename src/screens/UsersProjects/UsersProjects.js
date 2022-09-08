import { View, FlatList, SafeAreaView } from 'react-native';
import React, { useState, useEffect } from 'react';
import {
  ProjectCard,
  NativeUiHeader,
  NativeUiText,
  NativeUiActivityIndicator,
} from '@components/';
import { useSelector, useDispatch } from 'react-redux';
import { getAUsersProject } from '../../redux/actions/projectsAction';
import styles from './UsersProjects.style';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { HEIGHT } from '../../../src/constants/theme';

const UsersProjects = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const projects = useSelector((state) => state.projects);

  const [currentPage, setCurrentPage] = useState(1);
  const [allProjects, setAllProjects] = useState([]);

  useEffect(() => {
    fetchAllProjects();
  }, [currentPage]);

  const fetchAllProjects = () => {
    dispatch(
      getAUsersProject({ page: currentPage, username: user?.user?.username })
    );
  };

  useEffect(() => {
    if (Array.isArray(projects?.myProjects?.results)) {
      setAllProjects([...allProjects, ...projects?.myProjects?.results]);
    }
  }, [projects?.myProjects]);

  const onEndReached = () => {
    if (projects?.myProjects?.next !== null) {
      return setCurrentPage(currentPage + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={'My projects'} />
      <NativeUiText textType="bold" style={styles.title} fontSize={27}>
        {user?.user?.username}'s projects
      </NativeUiText>
      <FlatList
        contentContainerStyle={[styles.list, DefaultStyles.containerCenter]}
        data={allProjects}
        keyExtractor={(_, index) => index}
        renderItem={({ item }) => (
          <View
            style={{
              height: HEIGHT / 2.3,
            }}
          >
            <ProjectCard item={item} token={user?.token} />
          </View>
        )}
        onEndReachedThreshold={0.1}
        onEndReached={onEndReached}
        ListFooterComponent={
          projects?.myProjects?.next !== null && <NativeUiActivityIndicator />
        }
      />
    </SafeAreaView>
  );
};

export default UsersProjects;
