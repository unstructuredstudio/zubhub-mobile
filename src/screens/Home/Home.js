import { FlatList, SafeAreaView, ScrollView } from "react-native";
import {
  NativeUiHeader,
  ProjectCard,
  NativeUiCardSkeleton,
  NativeUiActivityIndicator,
} from "@components/";
import React, { useState, useEffect } from "react";
import styles from "./Home.style";
import DefaultStyles from "../../constants/DefaultStyles.style";
import { getAllProjects } from "../../redux/actions/projectsAction";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { loadUser } from "../../redux/actions/authAction";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOKEN } from "../../utils/storageKeys";

const Home = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const numberOfPosts = new Array(22).fill(null);
  const projects = useSelector((state) => state.projects);
  const user = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allProjects, setAllProjects] = useState([]);

  useEffect(() => {
    loadUserData();
    fetchAllProjects();
  }, [currentPage]);

  const loadUserData = async () => {
    dispatch(loadUser(await AsyncStorage.getItem(TOKEN)));
  };

  const fetchAllProjects = () => {
    if (allProjects.length < 1) {
      setLoading(true);
    }
    dispatch(
      getAllProjects(setLoading, {
        page: currentPage,
        token: user?.token,
        t: t,
      })
    );
  };

  //Sets list of projects to display
  useEffect(() => {
    if (Array.isArray(projects?.all_projects?.results)) {
      setAllProjects([...allProjects, ...projects?.all_projects?.results]);
    }
  }, [projects?.all_projects]);

  //Fetches next paginated set of projects
  const onEndReached = () => {
    if (projects?.all_projects?.next !== null) {
      console.log(projects?.all_projects?.next, "page number");
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
        <FlatList
          contentContainerStyle={[styles.list, DefaultStyles.containerCenter]}
          data={allProjects}
          keyExtractor={(_, index) => index}
          renderItem={({ item }) => <ProjectCard item={item} />}
          onEndReachedThreshold={0}
          onEndReached={onEndReached}
          ListFooterComponent={
            projects?.all_projects?.next !== null && (
              <NativeUiActivityIndicator />
            )
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Home;
