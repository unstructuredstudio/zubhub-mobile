import { FlatList, SafeAreaView, ScrollView, View } from 'react-native';
import {
  NativeUiHeader,
  ProjectCard,
  NativeUiCardSkeleton,
  NativeUiActivityIndicator,
  NativeUiText,
} from '@components/';
import React, { useState, useEffect } from 'react';
import styles from './Home.style';
import DefaultStyles from '../../constants/DefaultStyles.style';
import {
  getAllProjects,
  getHeroProperties,
} from '../../redux/actions/projectsAction';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { loadUser } from '../../redux/actions/authAction';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN } from '../../utils/storageKeys';
import { HEIGHT } from '../../../src/constants/theme';
import { RESET } from '../../redux/types/index';

const Home = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const numberOfPosts = new Array(22).fill(null);
  const projects = useSelector((state) => state.projects);
  const user = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allProjects, setAllProjects] = useState([]);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadUserData();
    dispatch(getHeroProperties());
  }, []);

  useEffect(() => {
    fetchAllProjects();
  }, [currentPage]);

  const loadUserData = async () => {
    setToken(await AsyncStorage.getItem(TOKEN));
    dispatch(loadUser(await AsyncStorage.getItem(TOKEN)));
  };

  const fetchAllProjects = () => {
    // setLoading(true);
    dispatch(
      getAllProjects(setLoading, {
        page: currentPage,
        token: user?.token,
      })
    );
  };
  useEffect(() => {
    if (Array.isArray(projects?.all_projects?.results)) {
      setAllProjects([...allProjects, ...projects?.all_projects?.results]);
      // dispatch({
      //   type: RESET,
      // });
    }
  }, [projects?.all_projects]);

  const onEndReached = () => {
    if (
      projects?.all_projects?.next !== null &&
      projects?.all_projects?.next !== undefined
    ) {
      return setCurrentPage(currentPage + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NativeUiHeader />
      {loading ? (
        <ScrollView>
          {numberOfPosts.map((_, i) => (
            <NativeUiCardSkeleton key={i} />
          ))}
        </ScrollView>
      ) : (
        <>
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
                <ProjectCard item={item} token={token} />
              </View>
            )}
            onEndReachedThreshold={0.8}
            onEndReached={onEndReached}
            ListFooterComponent={
              projects?.all_projects?.next !== null && (
                <NativeUiActivityIndicator />
              )
            }
          />
          {/* <FlatList
            contentContainerStyle={[styles.list, DefaultStyles.containerCenter]}
            data={[
              1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
              4, 4, 4,
            ]}
            keyExtractor={(_, index) => index}
            renderItem={({ item }) => (
              <View
                style={{
                  height: 124,
                }}
              >
                <NativeUiText>{item}</NativeUiText>
              </View>
            )}
            // onEndReachedThreshold={0.8}
            onEndReached={onEndReached}
            // ListFooterComponent={
            //   projects?.all_projects?.next !== null && (
            //     <NativeUiActivityIndicator />
            //   )
            // }
          /> */}
        </>
      )}
    </SafeAreaView>
  );
};

export default Home;
