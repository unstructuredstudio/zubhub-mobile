const baseURL = "http://localhost:8000/api";
import i18n from "i18next";

const request = ({
  url = "/",
  method = "GET",
  token,
  body,
  content_type = "application/json",
}) => {
  if (method === "GET" && !token) {
    return fetch(baseURL + url, {
      method,
      xsrfCookieName: "csrftoken",
      xsrfHeaderName: "X-CSRFToken",
      withCredentials: "true",
      headers: new Headers({
        "Content-Type": content_type,
        // 'Accept-Language': `${i18next.language},en;q=0.5`,
      }),
    });
  } else if (token && body) {
    return fetch(baseURL + url, {
      method,
      xsrfCookieName: "csrftoken",
      xsrfHeaderName: "X-CSRFToken",
      withCredentials: "true",
      headers: content_type
        ? new Headers({
            Authorization: `Token ${token}`,
            "Content-Type": content_type,
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
      xsrfCookieName: "csrftoken",
      xsrfHeaderName: "X-CSRFToken",
      withCredentials: "true",
      headers: new Headers({
        Authorization: `Token ${token}`,
        "Content-Type": content_type,
        // 'Accept-Language': `${i18next.language},en;q=0.5`,
      }),
    });
  } else if (body) {
    console.log(baseURL + url);
    return fetch(baseURL + url, {
      method,
      xsrfCookieName: "csrftoken",
      xsrfHeaderName: "X-CSRFToken",
      withCredentials: "true",
      headers: new Headers({
        "Content-Type": content_type,

        "Accept-Language": `en`,
      }),
      body,
    });
  }
};

/**
 * @method login - login with email and password
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const signup = (userData) => {
  const url = `/creators/register/`;
  const method = "POST";
  const body = JSON.stringify({ ...userData, subscribe: false });

  return request({ url, method, body }).then((res) => res.json());
};

/**
 * @method login - login with email and password
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const login = ({ username, password }) => {
  const url = "/rest-auth/login/";
  const method = "POST";
  const body = JSON.stringify({ username, password });

  return request({ url, method, body }).then((res) => res.json());
};

/**
 * @method getAuthUser - make api request to this endpoint providing a valid user token to
 *         get the user profile of the user with the provided token
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const getAuthUser = (token) => {
  const url = "/creators/auth-user/";
  return request({ url, token }).then((res) => res.json());
};

/**
 * @method sendPasswordResetLink
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const sendPasswordResetLink = (email) => {
  const url = "/rest-auth/password/reset/";
  const method = "POST";
  const body = JSON.stringify({ email });

  return request({ url, method, body }).then((res) =>
    Promise.resolve(res.status === 200 ? { detail: "ok" } : res.json())
  );
};

/**
 * @method getProjects
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const getProjects = ({ token, page }) => {
  const url = page ? `/projects/?page=${page}` : `projects/`;
  return request({ token, url }).then((res) => res.json());
};

/**
 * @method getProjects
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const getAProjectsDetail = (id) => {
  const url = `/projects/${id}`;
  return request({ url }).then((res) => res.json());
};

/**
 * @method toggleLike
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const toggleLike = ({ id, token }) => {
  const url = `/projects/${id}/toggle-like/`;

  return request({ url, token }).then((res) => res.json());
};

/**
 * @method toggleSave
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const toggleSave = ({ id, token }) => {
  const url = `/projects/${id}/toggle-save/`;

  return request({ url, token }).then((res) => res.json());
};

/**
 * @method getFollowers - get a list of users that a username is following
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const getFollowers = ({ page, username }) => {
  const url = page
    ? `/creators/${username}/followers/?page=${page}`
    : `/creators/${username}/followers/`;

  return request({ url }).then((res) => res.json());
};

/**
 * @method getFollowing
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const getFollowing = ({ page, username }) => {
  const url = page
    ? `/creators/${username}/following/?${page}`
    : `/creators/${username}/following/`;

  return request({ url }).then((res) => res.json());
};

/**
 * @method getSaved - get a list of projects bookmarked by the user with the given token
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const getSaved = ({ page, token }) => {
  const url = page ? `/projects/saved/?page=${page}` : `projects/saved/`;

  return request({ url, token }).then((res) => res.json());
};

/**
 * @method editUserProfile
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const editUserProfile = (props) => {
  const { token, username, email, phone, dateOfBirth, bio, user_location } =
    props;

  const url = "/creators/edit-creator/";
  const method = "PUT";
  const body = JSON.stringify({
    username,
    email,
    phone,
    dateOfBirth,
    bio,
    location: user_location,
  });
  return request({ url, method, token, body }).then((res) => res.json());
};

/**
 * @method deleteAccount
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const deleteAccount = ({ token }) => {
  const url = "/creators/delete/";
  const method = "DELETE";
  return request({ url, method, token }).then((res) =>
    Promise.resolve(res.status === 204 ? { detail: "ok" } : res.json())
  );
};

/**
 * @method getUserProjects - get a paginated list of projects
 *         created by the user with the provided username
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const getUserProjects = ({ username, page }) => {
  const url = page
    ? `/creators/${username}/projects/?page=${page}`
    : `/creators/${username}/projects/`;

  return request({ url }).then((res) => res.json());
};

/**
 * @method toggleFollow
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe method's signature
 */
export const toggleFollow = ({ id, token }) => {
  const url = `/creators/${id}/toggle-follow/`;

  return request({ url, token }).then((res) => res.json());
};
