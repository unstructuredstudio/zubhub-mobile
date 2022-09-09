import { SET_PROJECTS, RESET } from '../types/index';

const initialState = {
  staff_picks: [],
  hero: {},
  zubhub: {},
};

export const projects_reducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_PROJECTS:
      return {
        ...state,
        ...payload,
      };

    case RESET:
      return {
        ...state,
        myProjects: null,
        all_projects: null,
      };

    default:
      return state;
  }
};
