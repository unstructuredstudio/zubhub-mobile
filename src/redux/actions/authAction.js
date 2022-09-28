import { SET_AUTH_USER, CLEAR } from '../types';
import {
  signup,
  login,
  sendPasswordResetLink,
  getAuthUser,
  getFollowers,
  getFollowing,
  addProfileComment,
  logout,
} from '../../ApiCall/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN, USER } from '../../utils/storageKeys';
import { CustomToasts } from '../../components/CustomToasts/CustomToasts';

/**
 * @function register
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const registerUser =
  (userData, setVisible, setLoading) => (dispatch) => {
    let response = signup(userData)
      .then(async (res) => {
        if (!res.key) {
          throw new Error(JSON.stringify(res));
        }

        await AsyncStorage.setItem(TOKEN, res.key);
        setLoading(false);
        dispatch({
          type: SET_AUTH_USER,
          payload: { token: res.key },
        });
      })
      .then(() => setVisible(true));
    return response;
  };

/**
 * @function login
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const loginUser = (userData, setVisible, setLoading) => (dispatch) => {
  let response = login(userData)
    .then(async (res) => {
      if (!res.key) {
        throw new Error(JSON.stringify(res));
      }

      let result = dispatch(loadUser(res.key));

      result.then(async (user) => {
        if (user) {
          await AsyncStorage.setItem(TOKEN, res.key);
          await AsyncStorage.setItem(USER, JSON.stringify(user));
          setLoading(false);
        }
      });
    })
    .then(() => setVisible(true));
  return response;
};

/**
 * @function getAuthUser
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const loadUser = (token, navigation, t) => (dispatch) => {
  let response = getAuthUser(token)
    .then((user) => {
      if (!user.id) {
        logoutUser(token, navigation, t);
      } else {
        dispatch({
          type: SET_AUTH_USER,
          payload: { user: user, token: token },
        });
        return true;
      }
    })
    .catch((err) => {
      console.log(err);
      CustomToasts({
        type: 'error',
        description: t('general.smagError'),
      });
    });
  return response;
};

/**
 * @function sendPasswordResetLink
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const resetPassordLink = (email, setVisible, setLoading) => {
  return () => {
    let response = sendPasswordResetLink(email).then((res) => {
      if (res.detail !== 'ok') {
        throw new Error(JSON.stringify(res));
      } else {
        setLoading(false);
        setVisible(true);
      }
    });
    return response;
  };
};

/**
 * @function getUserFollowers
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const getAUsersFollowers = (args) => (dispatch) => {
  let response = getFollowers(args)
    .then((res) => {
      if (Array.isArray(res.results)) {
        dispatch({
          type: SET_AUTH_USER,
          payload: { myFollowers: res },
        });
      } else {
        res = Object.keys(res)
          .map((key) => res[key])
          .join('\n');
        throw new Error(res);
      }
    })
    .catch((error) => {
      if (error.message.startsWith('Unexpected')) {
        CustomToasts({
          type: 'error',
          description: args.t('general.smagError'),
        });
      } else {
        CustomToasts({
          type: 'error',
          description: error.message,
        });
      }
    });
  return response;
};

/**
 * @function getUserFollowers
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const getAUsersFollowingList = (args) => (dispatch) => {
  let response = getFollowing(args)
    .then((res) => {
      console.log(res);
      if (Array.isArray(res.results)) {
        dispatch({
          type: SET_AUTH_USER,
          payload: { myFollowingList: res },
        });
      } else {
        res = Object.keys(res)
          .map((key) => res[key])
          .join('\n');
        throw new Error(res);
      }
    })
    .catch((error) => {
      if (error.message.startsWith('Unexpected')) {
        CustomToasts({
          type: 'error',
          description: args.t('general.smagError'),
        });
      } else {
        console.log(error, 'error in getting bookmarks');
        CustomToasts({
          type: 'error',
          description: error.message,
        });
      }
    });
  return response;
};

/**
 * @function addComment
 * @author Alice Ndeh <alicendeh@gmail.com>
 *
 * @todo - describe function's signature
 */
export const addComment = (args) => {
  let response = addProfileComment(args)
    .then((res) => {
      if (res.username) {
        return { profile: res, loading: false };
      } else {
        res = Object.keys(res)
          .map((key) => res[key])
          .join('\n');
        throw new Error(res);
      }
    })
    .catch((error) => {
      if (error.message.startsWith('Unexpected')) {
        CustomToasts({
          type: 'error',
          description: args.t('general.smagError'),
        });
      } else {
        CustomToasts({
          type: 'error',
          description: error.message,
        });
      }
    });

  return response;
};

//Clear users info
export const clearUsersInfo = () => (dispatch) => {
  dispatch({
    type: CLEAR,
  });
  return Promise.resolve(true);
};

/**
 * @function logout
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const logoutUser = (token, navigation, t) => (dispatch) => {
  let response = logout(token)
    .then(async (res) => {
      if (res.status === 200) {
        await AsyncStorage.removeItem(TOKEN);
        dispatch({
          type: SET_AUTH_USER,
          payload: {
            token: null,
            username: null,
            id: null,
            avatar: null,
            members_count: null,
            tags: [],
          },
        });

        navigation.navigate('Login');
      } else {
        CustomToasts({
          type: 'error',
          description: t('general.logoutFailed'),
        });
      }
    })
    .catch(() => {
      CustomToasts({
        type: 'error',
        description: t('general.logoutFailed'),
      });
    });
  return response;
};
