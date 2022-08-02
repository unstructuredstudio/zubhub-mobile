import { REGISTER_USER, REGISTER_USER_FAIL, SET_AUTH_USER } from '../types';
import { signup, login } from '../../ApiCall/Authentication';

/**
 * @function register
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const registerUser =
  (userData, setVisible, setLoading) => (dispatch) => {
    let response = signup(userData)
      .then((res) => {
        if (!res.key) {
          throw new Error(JSON.stringify(res));
        }
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
    .then((res) => {
      if (!res.key) {
        throw new Error(JSON.stringify(res));
      }
      setLoading(false);
      dispatch({
        type: SET_AUTH_USER,
        payload: { token: res.key },
      });
    })
    .then(() => setVisible(true));
  return response;
};
