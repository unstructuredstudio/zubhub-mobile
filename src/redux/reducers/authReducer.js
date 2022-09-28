import { SET_AUTH_USER, CLEAR } from '../types/index';

const initialState = {
  token: null,
  username: null,
  id: null,
  avatar: null,
  members_count: null,
  tags: [],
};

export const auth_reducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_AUTH_USER:
      return {
        ...state,
        ...action.payload,
      };
    case CLEAR:
      console.log('in here ohh');
      return {
        ...state,
        myFollowers: [],
      };

    default:
      return state;
  }
};
