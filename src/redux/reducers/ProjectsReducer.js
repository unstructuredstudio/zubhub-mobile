import { GET_ALL_PROJECTS } from '../types/index';

const initialState = {
  allProjects: [],
};

export const projects_reducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_ALL_PROJECTS:
      return {
        ...state,
        allProjects: payload,
      };

    default:
      return state;
  }
};
