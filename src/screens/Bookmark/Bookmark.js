import { View, FlatList } from "react-native";
import React, { useState, useEffect } from "react";
import { ProjectCard, NativeUiHeader, NativeUiText } from "@components/";
import { useSelector, useDispatch } from "react-redux";
import { getSavedProjects } from "../../redux/actions/projectsAction";
import styles from "./Bookmark.style";
import DefaultStyles from "../../constants/DefaultStyles.style";

const Bookmark = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const projects = useSelector((state) => state.projects);

  const [currentPage, setCurrentPage] = useState(1);
  const [allProjects, setAllProjects] = useState([]);

  useEffect(() => {
    fetchAllProjects();
  }, [currentPage]);

  const fetchAllProjects = () => {
    dispatch(getSavedProjects({ page: currentPage, token: user?.token }));
  };

  useEffect(() => {
    if (Array.isArray(projects?.bookmarks?.results)) {
      setAllProjects([...allProjects, ...projects?.bookmarks?.results]);
    }
  }, [projects?.bookmarks]);

  useEffect(() => {
    console.log(allProjects, "all pro");
  }, [allProjects]);

  const onEndReached = () => {
    console.log("end reach");
    if (projects?.bookmarks?.next !== null) {
      console.log("should i");
      console.log(projects?.bookmarks?.next, "page number");
      return setCurrentPage(currentPage + 1);
    }
  };

  return (
    <View>
      <NativeUiHeader subScreen={true} sectionTitle={"Saved projects"} />
      <NativeUiText textType="bold" style={styles.title} fontSize={27}>
        Your saved projects
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
