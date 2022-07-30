import {
  REGISTER_USER,
  REGISTER_USER_FAIL,
  SET_AUTH_USER,
} from '../types/index';

const initialState = {
  user: null,
  isAuthenticated: false,
  error: null,
  token: null,
};

export const auth_reducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case REGISTER_USER:
      return {
        ...state,
        user: payload,
      };
    case REGISTER_USER_FAIL:
      return {
        ...state,
        error: payload,
      };

    case SET_AUTH_USER:
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
};
