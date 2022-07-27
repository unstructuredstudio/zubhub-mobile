import { REGISTER_USER, REGISTER_USER_FAIL } from '../types/index';

const initialState = {
  user: null,
  isAuthenticated: false,
  error: null,
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

    default:
      return state;
  }
};
