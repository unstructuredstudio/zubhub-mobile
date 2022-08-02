import { REGISTER_USER, REGISTER_USER_FAIL, SET_AUTH_USER } from '../types';
import { signup, _Register } from '../../ApiCall/Authentication';
// _Register;
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
