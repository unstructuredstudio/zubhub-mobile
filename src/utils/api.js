import axios from 'axios';

const api = axios.create({
  baseURL: 'http://172.20.10.3:8000/api',
});

export { api };