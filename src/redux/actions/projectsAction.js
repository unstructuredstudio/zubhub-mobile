import { GET_ALL_PROJECTS } from '../types';
import { _getAllProjects } from '../../ApiCall/Projects';

export const getAllProjects = () => {
  return async (dispatch) => {
    _getAllProjects().then((res) => {
      if (res.status === 200) {
        dispatch({
          type: GET_ALL_PROJECTS,
          payload: res.data,
        });
      } else {
        // dispatch({
        //   type: REGISTER_USER_FAIL,
        //   payload: res.message,
        // });
      }
    });
  };
};
