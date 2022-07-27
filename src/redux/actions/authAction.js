import { REGISTER_USER, REGISTER_USER_FAIL } from '../types';
import { _Register } from '../../ApiCall/Authentication';
_Register;
export const registerUser = (userData) => {
  return async (dispatch) => {
    _Register(userData).then((res) => {
      if (res.status === 200) {
        dispatch({
          type: REGISTER_USER,
          payload: res.data,
        });
      } else {
        console.log(res, 'kfdfop');
        dispatch({
          type: REGISTER_USER_FAIL,
          payload: res,
        });
      }
    });
  };
};
