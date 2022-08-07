import { SET_AUTH_USER } from "../types/index";

const initialState = {
  user: null,
  isAuthenticated: false,
  error: null,
  token: null,
};

export const auth_reducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_AUTH_USER:
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
};
