import axios from 'axios';
import { api } from '../utils/api';

export const _getAllProjects = async () => {
  try {
    let res = await api.get('/projects/?page=1');

    return {
      status: 200,
      data: res.data.results,
    };
  } catch (err) {
    console.log(err);
  }
};
