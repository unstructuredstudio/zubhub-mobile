import { View, FlatList, Image, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import {
  NativeUiHeader,
  NativeUiText,
  NativeUiActivityIndicator,
} from '@components/';
import { useSelector, useDispatch } from 'react-redux';
import styles from './UsersFollowing.style';
import {
  getAUsersFollowingList,
  loadUser,
} from '../../redux/actions/authAction';
import * as THEME from '../../constants/theme';
import { toggleFollowOnProject } from '../../redux/actions/projectsAction';
import { useTranslation } from 'react-i18next';

const UsersFollowing = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const { t } = useTranslation();

  const [currentPage, setCurrentPage] = useState(1);
  const [allFollowingList, setAllFollowingList] = useState([]);

  useEffect(() => {
    fetchAllFollowers();
  }, []);

  const fetchAllFollowers = () => {
    dispatch(
      getAUsersFollowingList({
        page: currentPage,
        username: user?.user?.username,
        t: t,
      })
    );
  };

  useEffect(() => {
    if (Array.isArray(user?.myFollowingList?.results)) {
      setAllFollowingList([
        ...allFollowingList,
        ...user?.myFollowingList?.results,
      ]);
    }
  }, [user?.myFollowingList]);

  const onEndReached = () => {
    if (user?.myFollowingList?.next !== null) {
      return setCurrentPage(currentPage + 1);
    }
  };

  const unfollowCreator = (id) => {
    let result = dispatch(
      toggleFollowOnProject({
        id: id,
        token: user?.token,
        t: t,
      })
    );
    result.then(() => {
      dispatch(loadUser(user?.token));
    });
  };

  return (
    <View style={styles.container}>
      <NativeUiHeader subScreen={true} sectionTitle={'People I follow'} />
      <NativeUiText textType="bold" style={styles.title} fontSize={27}>
        {t('general.creator')} {user?.user?.username} {t('general.isFollowing')}
      </NativeUiText>
      <FlatList
        contentContainerStyle={styles.list}
        numColumns={2}
        data={allFollowingList}
        keyExtractor={(_, index) => index}
        renderItem={({ item }) => (
          <View style={styles.listItems}>
            <View style={styles.imgContainer}>
              <Image style={styles.avater} source={{ uri: item.avatar }} />
            </View>
            <View>
              <TouchableOpacity
                onPress={() => unfollowCreator(item.id)}
                style={styles.unfollowContainer}
              >
                <NativeUiText
                  fontSize={12}
                  style={styles.unfollow}
                  textColor={THEME.COLORS.WHITE}
                >
                  Unfollow
                </NativeUiText>
              </TouchableOpacity>
              <NativeUiText textType="bold" fontSize={14} style={styles.name}>
                {item?.username}
              </NativeUiText>
            </View>
          </View>
        )}
        onEndReachedThreshold={0.1}
        onEndReached={onEndReached}
        ListFooterComponent={
          user?.myFollowingList?.next !== null && <NativeUiActivityIndicator />
        }
      />
    </View>
  );
};

export default UsersFollowing;
