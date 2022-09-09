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
export const loadUser = (token) => (dispatch) => {
  let response = getAuthUser(token)
    .then((user) => {
      dispatch({
        type: SET_AUTH_USER,
        payload: { user: user, token: token },
      });
      return true;
    })
    .catch((err) => {
      // CustomToasts({
      //   type: "error",
      //   text: "Failed to load user",
      // });
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
        console.log('error in getting followes');

        // toast.warning(args.t("savedProjects.errors.unexpected"));
      } else {
        console.log(error, 'error in getting followes');

        // toast.warning(error.message);
      }
      // return { loading: false };
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
        console.log('error in getting bookmarks');

        // toast.warning(args.t("savedProjects.errors.unexpected"));
      } else {
        console.log(error, 'error in getting bookmarks');

        // toast.warning(error.message);
      }
      // return { loading: false };
    });
  return response;
};

/**
 * @function addComment
 * @author Raymond Ndibe <ndiberaymond1@gmail.com>
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
        console.log('err', error);

        // toast.warning(args.t('comments.errors.unexpected'));
      } else {
        console.log('err', error);
        // toast.warning(error.message);
      }
      // return { loading: false };
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
export const logoutUser = (token, navigation) => (dispatch) => {
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
      }
    })
    .then(() => console.log('error'));
  return response;
};
