import { getProjects, getAProjectsDetail } from "../../ApiCall/api";
import { SET_PROJECTS } from "../types";
import { CustomToasts } from "../../components/CustomToasts/CustomToasts";

export const getAllProjects = (setLoading, args) => (dispatch) => {
  let response = getProjects(args)
    .then((res) => {
      if (Array.isArray(res.results)) {
        dispatch({
          type: SET_PROJECTS,
          payload: { all_projects: res },
        });
        setLoading(false);
        return true;
      } else {
        res = Object.keys(res)
          .map((key) => res[key])
          .join("\n");
        throw new Error(res);
      }
    })
    .catch((error) => {
      if (error.message.startsWith("Unexpected")) {
        CustomToasts({
          type: error,
          description: "oops error occured",
        });
      } else {
        CustomToasts({
          type: error,
          description: error.message,
        });
      }
      setLoading(false);
    });
  return response;
};

export const getProjectDetails = (id, setLoading) => (dispatch) => {
  let response = getAProjectsDetail(id)
    .then((res) => {
      setLoading(false);
      if (res.hasOwnProperty("id")) {
        return res;
      }
    })
    .catch((error) => {
      console.log(error, "error in getting all projects");
      if (error.message.startsWith("Unexpected")) {
        // CustomToasts({
        //   type: error,
        //   description: args.t("projects.errors.unexpected"),
        // });
      } else {
        // CustomToasts({
        //   type: error,
        //   description: error.message,
        // });
      }
      setLoading(false);
    });

  return response;
};
