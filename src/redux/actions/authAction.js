import { REGISTER_USER, REGISTER_USER_FAIL, SET_AUTH_USER } from '../types';
import { signup, _Register } from '../../ApiCall/Authentication';
_Register;
export const registerUser = (userData) => {
  return async (dispatch) => {
    signup(userData).then((res) => {
      console.log(res, 'in auth action');
      // if (!res.key) {
      //   console.log(res, 'in action');
      //   throw new Error(JSON.stringify(res));
      // }
      // console.log(res, 'in action success');

      // dispatch({
      //   type: SET_AUTH_USER,
      //   payload: { token: res.key },
      // });
    });
  };
};
