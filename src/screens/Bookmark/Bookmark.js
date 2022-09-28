import { View, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import {
  ProjectCard,
  NativeUiHeader,
  NativeUiText,
  NativeUiActivityIndicator,
} from '@components/';
import { useSelector, useDispatch } from 'react-redux';
import { getSavedProjects } from '../../redux/actions/projectsAction';
import styles from './Bookmark.style';
import DefaultStyles from '../../constants/DefaultStyles.style';
import { useTranslation } from 'react-i18next';

const Bookmark = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const projects = useSelector((state) => state.projects);
  const { t } = useTranslation();

  const [currentPage, setCurrentPage] = useState(1);
  const [allProjects, setAllProjects] = useState([]);

  useEffect(() => {
    fetchAllProjects();
  }, [currentPage]);

  const fetchAllProjects = () => {
    dispatch(getSavedProjects({ page: currentPage, token: user?.token, t: t }));
  };

  useEffect(() => {
    if (Array.isArray(projects?.bookmarks?.results)) {
      setAllProjects([...allProjects, ...projects?.bookmarks?.results]);
    }
  }, [projects?.bookmarks]);

  const onEndReached = () => {
    console.log('end');
    if (projects?.bookmarks?.next !== null) {
      console.log('am i still fetching?');
      return setCurrentPage(currentPage + 1);
    }
  };

  useEffect(() => {
    console.log(allProjects?.length);
  }, [allProjects]);
  return (
    <View style={styles.container}>
      <NativeUiHeader
        subScreen={true}
        sectionTitle={t('general.savedProjects')}
      />
      <NativeUiText textType="bold" style={styles.title} fontSize={27}>
        {t('general.yoursavedProjects')}
      </NativeUiText>
      <FlatList
        contentContainerStyle={[styles.list, DefaultStyles.containerCenter]}
        data={allProjects}
        keyExtractor={(_, index) => index}
        renderItem={({ item }) => (
          <ProjectCard item={item} token={user?.token} />
        )}
        onEndReachedThreshold={0.1}
        onEndReached={onEndReached}
        ListFooterComponent={
          projects?.bookmarks?.next !== null && <NativeUiActivityIndicator />
        }
      />
    </View>
  );
};

export default Bookmark;
