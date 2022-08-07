import { SET_AUTH_USER } from "../types";
import { signup, login, sendPasswordResetLink } from "../../ApiCall/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOKEN } from "../../utils/storageKeys";

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
 * @function sendPasswordResetLink
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const resetPassordLink = (email, setVisible, setLoading) => {
  return () => {
    let response = sendPasswordResetLink(email).then((res) => {
      if (res.detail !== "ok") {
        throw new Error(JSON.stringify(res));
      } else {
        setLoading(false);
        setVisible(true);
      }
    });
    return response;
  };
};
