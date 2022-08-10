import {
  getProjects,
  getAProjectsDetail,
  toggleLike,
  toggleSave,
  getSaved,
  getFollowing,
  getUserProjects,
} from "../../ApiCall/api";
import { SET_PROJECTS } from "../types";
import { CustomToasts } from "../../components/CustomToasts/CustomToasts";

//Get all projects
export const getAllProjects = (setLoading, args) => (dispatch) => {
  let response = getProjects(args)
    .then((res) => {
      console.log(res, "my projects");
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
        // CustomToasts({
        //   type: error,
        //   description: "oops error occured",
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

//Get project details
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

/**
 * @function toggleLike
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const toggleLikeOnProject = (args) => {
  return () => {
    return toggleLike(args)
      .then((res) => {
        console.log(res, "response ogg");
        if (res.title) {
          return { project: res };
        } else {
          res = Object.keys(res)
            .map((key) => res[key])
            .join("\n");
          throw new Error(res);
        }
      })
      .catch((error) => {
        if (error.message.startsWith("Unexpected")) {
          console.log("error in toggling lin=ke on project");
          // toast.warning(args.t("projectDetails.errors.unexpected"));
        } else {
          console.log("error in toggling lin=ke on project");

          // toast.warning(error.message);
        }

        return { loading: false };
      });
  };
};

/**
 * @function toggleSave
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const toggleSaveOnProject = (args) => {
  return () => {
    return toggleSave(args)
      .then((res) => {
        if (res.title) {
          return { project: res };
        } else {
          res = Object.keys(res)
            .map((key) => res[key])
            .join("\n");
          throw new Error(res);
        }
      })
      .catch((error) => {
        if (error.message.startsWith("Unexpected")) {
          console.log("error in saving project");

          // toast.warning(args.t("projects.errors.unexpected"));
        } else {
          console.log("error in saving project");

          // toast.warning(error.message);
        }
        return { loading: false };
      });
  };
};

/**
 * @function getSaved
 * @author Alice Ndeh <aliceNdeh@gmail.com>
 *
 * @todo - describe function's signature
 */
export const getSavedProjects = (args) => (dispatch) => {
  let response = getSaved(args)
    .then((res) => {
      if (Array.isArray(res.results)) {
        // console.log(res);
        dispatch({
          type: SET_PROJECTS,
          payload: { bookmarks: res },
        });
      } else {
        res = Object.keys(res)
          .map((key) => res[key])
          .join("\n");
        throw new Error(res);
      }
    })
    .catch((error) => {
      if (error.message.startsWith("Unexpected")) {
        console.log("error in getting bookmarks");

        // toast.warning(args.t("savedProjects.errors.unexpected"));
      } else {
        console.log(error, "error in getting bookmarks");

        // toast.warning(error.message);
      }
      // return { loading: false };
    });
  return response;
};

/**
 * @function getUserProject
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const getAUsersProject = (args) => (dispatch) => {
  let response = getUserProjects(args)
    .then((res) => {
      if (Array.isArray(res.results)) {
        // console.log(res);
        dispatch({
          type: SET_PROJECTS,
          payload: { myProjects: res },
        });
      } else {
        res = Object.keys(res)
          .map((key) => res[key])
          .join("\n");
        throw new Error(res);
      }
    })
    .catch((error) => {
      if (error.message.startsWith("Unexpected")) {
        console.log("error in getting bookmarks");

        // toast.warning(args.t("savedProjects.errors.unexpected"));
      } else {
        console.log(error, "error in getting bookmarks");

        // toast.warning(error.message);
      }
      // return { loading: false };
    });
  return response;
};
