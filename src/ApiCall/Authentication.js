import { api } from '../utils/api';

export const _Register = async (userData) => {
  try {
    let res = await api.post('/creators/register/', userData);
    return {
      status: 200,
      data: res.data.results,
    };
  } catch (err) {
    console.log(err);
    return err;
  }
};
