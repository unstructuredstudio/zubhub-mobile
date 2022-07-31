const baseURL = 'http://localhost:8000/api';
import i18n from 'i18next';

const request = ({
  url = '/',
  method = 'GET',
  token,
  body,
  content_type = 'application/json',
}) => {
  if (method === 'GET' && !token) {
    return fetch(baseURL + url, {
      method,
      xsrfCookieName: 'csrftoken',
      xsrfHeaderName: 'X-CSRFToken',
      withCredentials: 'true',
      headers: new Headers({
        'Content-Type': content_type,
        // 'Accept-Language': `${i18next.language},en;q=0.5`,
      }),
    });
  } else if (token && body) {
    return fetch(baseURL + url, {
      method,
      xsrfCookieName: 'csrftoken',
      xsrfHeaderName: 'X-CSRFToken',
      withCredentials: 'true',
      headers: content_type
        ? new Headers({
            Authorization: `Token ${token}`,
            'Content-Type': content_type,
            // 'Accept-Language': `${i18next.language},en;q=0.5`,
          })
        : new Headers({
            Authorization: `Token ${token}`,
            // 'Accept-Language': `${i18next.language},en;q=0.5`,
          }),
      body,
    });
  } else if (token) {
    return fetch(baseURL + url, {
      method,
      xsrfCookieName: 'csrftoken',
      xsrfHeaderName: 'X-CSRFToken',
      withCredentials: 'true',
      headers: new Headers({
        Authorization: `Token ${token}`,
        'Content-Type': content_type,
        // 'Accept-Language': `${i18next.language},en;q=0.5`,
      }),
    });
  } else if (body) {
    return fetch(baseURL + url, {
      method,
      xsrfCookieName: 'csrftoken',
      xsrfHeaderName: 'X-CSRFToken',
      withCredentials: 'true',
      headers: new Headers({
        'Content-Type': content_type,

        'Accept-Language': `en`,
      }),
      body,
    });
  }
};

export const signup = (userData) => {
  const url = `/creators/register/`;
  const method = 'POST';
  const body = JSON.stringify({ ...userData, subscribe: false });

  return request({ url, method, body }).then((res) => res.json());

  // return request({ url, method, body })
  //   .then((res) => {
  //       // .then((res) => {
  //   //   // console.log(res.json(), 'from request');
  //   //   res.json().then((ele) => console.log(ele));
  //   // })
  //   })
  //   .catch((err) => console.log(err));
};
