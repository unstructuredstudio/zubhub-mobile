import { combineReducers } from 'redux';
import { projects_reducer } from './ProjectsReducer';
import { auth_reducer } from './authReducer';

export default combineReducers({
  projects: projects_reducer,
  user: auth_reducer,
});
