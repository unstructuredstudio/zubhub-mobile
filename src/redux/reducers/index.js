import { combineReducers } from 'redux';
import { projects_reducer } from './ProjectsReducer';

export default combineReducers({
  projects: projects_reducer,
});
