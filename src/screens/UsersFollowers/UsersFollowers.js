import { View, FlatList, Image } from "react-native";
import React, { useState, useEffect } from "react";
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiActivityIndicator,
} from "@components/";
import { useSelector, useDispatch } from "react-redux";
import styles from "./UsersFollowers.style";
import DefaultStyles from "../../constants/DefaultStyles.style";
import { getAUsersFollowers } from "../../redux/actions/authAction";
import * as THEME from "../../constants/theme";

const UsersFollowers = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  const [currentPage, setCurrentPage] = useState(1);
  const [allProjects, setAllProjects] = useState([]);

  useEffect(() => {
    fetchAllFollowers();
  }, []);

  const fetchAllFollowers = () => {
    dispatch(
      getAUsersFollowers({ page: currentPage, username: user?.user?.username })
    );
  };

  useEffect(() => {
    if (Array.isArray(user?.myFollowers?.results)) {
      setAllProjects([...allProjects, ...user?.myFollowers?.results]);
    }
  }, [user?.myFollowers]);

  const onEndReached = () => {
    if (user?.myFollowers?.next !== null) {
      return setCurrentPage(currentPage + 1);
    }
  };

  return (
    <View style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={"My Followers"} />
      <NativeUiText textType="bold" style={styles.title} fontSize={27}>
        {user?.user?.username}'s followers
      </NativeUiText>
      <FlatList
        contentContainerStyle={styles.list}
        numColumns={2}
        data={allProjects}
        keyExtractor={(_, index) => index}
        renderItem={({ item }) => (
          <View style={styles.listItems}>
            <View style={styles.imgContainer}>
              <Image style={styles.avater} source={{ uri: item.avatar }} />
            </View>
            <View
              style={{
                alignItems: "center",
              }}
            >
              <View style={styles.unfollowContainer}>
                <NativeUiText
                  fontSize={12}
                  style={styles.unfollow}
                  textColor={THEME.COLORS.WHITE}
                >
                  Unfollow
                </NativeUiText>
              </View>
              <NativeUiText textType="bold" fontSize={18} style={styles.name}>
                {item?.username}{" "}
              </NativeUiText>
            </View>
          </View>
        )}
        onEndReachedThreshold={0.1}
        onEndReached={onEndReached}
        ListFooterComponent={
          user?.myFollowers?.next !== null && <NativeUiActivityIndicator />
        }
      />
    </View>
  );
};

export default UsersFollowers;
