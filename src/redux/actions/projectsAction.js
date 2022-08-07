import { getProjects } from "../../ApiCall/api";
import { SET_PROJECTS } from "../types";

export const getAllProjects = (setLoading, args) => (dispatch) => {
  let response = getProjects(args)
    .then((res) => {
      if (Array.isArray(res.results)) {
        dispatch({
          type: SET_PROJECTS,
          payload: { all_projects: res },
        });
        setLoading(false);
      } else {
        res = Object.keys(res)
          .map((key) => res[key])
          .join("\n");
        throw new Error(res);
      }
      dispatch({
        type: SET_AUTH_USER,
        payload: { token: res.key },
      });
    })
    .catch((error) => {
      if (error.message.startsWith("Unexpected")) {
        // toast.warning(props.t("projects.errors.unexpected"));
      } else {
        // toast.warning(error.message);
      }
      setLoading(false);
    });
  return response;
};
