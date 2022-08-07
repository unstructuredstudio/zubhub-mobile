import { SET_PROJECTS } from "../types/index";

const initialState = {
  allProjects: [],
};

export const projects_reducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_PROJECTS:
      return {
        ...state,
        ...payload,
      };

    default:
      return state;
  }
};
