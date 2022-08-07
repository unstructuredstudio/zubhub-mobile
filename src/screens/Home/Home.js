import { FlatList, SafeAreaView, ScrollView } from "react-native";
import {
  NativeUiHeader,
  ProjectCard,
  NativeUiCardSkeleton,
} from "@components/";
import React, { useState, useEffect } from "react";
import styles from "./Home.style";
import DefaultStyles from "../../constants/DefaultStyles.style";
import { getAllProjects } from "../../redux/actions/projectsAction";
import { useSelector, useDispatch } from "react-redux";

const Home = () => {
  const dispatch = useDispatch();
  const numberOfPosts = new Array(22).fill(null);
  const projects = useSelector((state) => state.projects);
  const user = useSelector((state) => state.user);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllProjects();
  }, []);

  const fetchAllProjects = () => {
    setLoading(true);
    dispatch(getAllProjects(setLoading, { page: 1, token: user?.token }));
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
          data={projects?.all_projects?.results}
          keyExtractor={(_, index) => index}
          renderItem={({ item }) => <ProjectCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
};

export default Home;

// import React from 'react';
// import { StyleSheet, View, Dimensions, ViewStyle } from 'react-native';
// import SkeletonLoader from 'expo-skeleton-loader';

// const { width, height } = Dimensions.get('window');

// const AvatarLayout = ({ size = 100, style }) => (
//   <SkeletonLoader>
//     <SkeletonLoader.Container
//       style={[{ flex: 1, flexDirection: 'row' }, style]}
//     >
//       <SkeletonLoader.Item
//         style={{
//           width: size,
//           height: size,
//           borderRadius: size / 2,
//           marginRight: 20,
//         }}
//       />
//       <SkeletonLoader.Container style={{ paddingVertical: 10 }}>
//         <SkeletonLoader.Item
//           style={{ width: 220, height: 20, marginBottom: 5 }}
//         />
//         <SkeletonLoader.Item style={{ width: 150, height: 20 }} />
//       </SkeletonLoader.Container>
//     </SkeletonLoader.Container>
//   </SkeletonLoader>
// );

// const PostLayout = () => (
//   <SkeletonLoader style={{ marginVertical: 10 }}>
//     <AvatarLayout style={{ marginBottom: 10 }} />

//     <SkeletonLoader.Item
//       style={{
//         width,
//         height: height / 4.5,
//         marginVertical: 10,
//         backgroundColor: 'red',
//       }}
//     />
//   </SkeletonLoader>
// );

// const numberOfPosts = new Array(2).fill(null);

// export default function App() {
//   return (
//     <View style={styles.container}>
//       {numberOfPosts.map((_, i) => (
//         <PostLayout key={i} />
//       ))}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'white',
//     padding: 10,
//   },
// });
