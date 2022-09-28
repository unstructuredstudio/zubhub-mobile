import {
  getProjects,
  getAProjectsDetail,
  toggleLike,
  toggleSave,
  getSaved,
  toggleFollow,
  getUserProjects,
  shouldUploadToLocal,
  shouldUploadToLocalPost,
  createProject,
  getCategories,
  getHero,
  deleteProject,
  addComment,
} from '../../ApiCall/api';
import { SET_PROJECTS } from '../types';
import { CustomToasts } from '../../components/CustomToasts/CustomToasts';
import { nanoid } from 'nanoid';
import { site_mode, publish_type } from '../../utils/constants';
import { doConfig, s3 as DO, slugify } from '../../utils/script';

//Get all projects
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
          .join('\n');
        throw new Error(res);
      }
    })
    .catch((error) => {
      if (error.message.startsWith('Unexpected')) {
        CustomToasts({
          type: 'error',
          description: args.t('general.smagError'),
        });
      } else {
        CustomToasts({
          type: 'error',
          description: error.message,
        });
      }
      setLoading(false);
    });
  return response;
};

//Get project details
export const getProjectDetails = (id, setLoading, t) => (dispatch) => {
  let response = getAProjectsDetail(id)
    .then((res) => {
      setLoading(false);
      if (res.hasOwnProperty('id')) {
        return res;
      }
    })
    .catch((error) => {
      console.log(error, 'error in getting all projects');
      if (error.message.startsWith('Unexpected')) {
        CustomToasts({
          type: 'error',
          description: t('general.smagError'),
        });
      } else {
        CustomToasts({
          type: 'error',
          description: error.message,
        });
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
        if (res.title) {
          return { project: res };
        } else {
          res = Object.keys(res)
            .map((key) => res[key])
            .join('\n');
          throw new Error(res);
        }
      })
      .catch((error) => {
        if (error.message.startsWith('Unexpected')) {
          CustomToasts({
            type: 'error',
            description: args.t('general.smagError'),
          });
        } else {
          CustomToasts({
            type: 'error',
            description: error.message,
          });
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
            .join('\n');
          throw new Error(res);
        }
      })
      .catch((error) => {
        if (error.message.startsWith('Unexpected')) {
          CustomToasts({
            type: 'error',
            description: args.t('general.smagError'),
          });
        } else {
          CustomToasts({
            type: 'error',
            description: error.message,
          });
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
        dispatch({
          type: SET_PROJECTS,
          payload: { bookmarks: res },
        });
      } else {
        res = Object.keys(res)
          .map((key) => res[key])
          .join('\n');
        throw new Error(res);
      }
    })
    .catch((error) => {
      if (error.message.startsWith('Unexpected')) {
        CustomToasts({
          type: 'error',
          description: args.t('general.smagError'),
        });
      } else {
        CustomToasts({
          type: 'error',
          description: error.message,
        });
      }
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
        dispatch({
          type: SET_PROJECTS,
          payload: { myProjects: res },
        });
      } else {
        res = Object.keys(res)
          .map((key) => res[key])
          .join('\n');
        throw new Error(res);
      }
    })
    .catch((error) => {
      if (error.message.startsWith('Unexpected')) {
        CustomToasts({
          type: 'error',
          description: args.t('general.smagError'),
        });
      } else {
        CustomToasts({
          type: 'error',
          description: error.message,
        });
      }
    });
  return response;
};

/**
 * @function toggleLike
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const toggleFollowOnProject = (args) => {
  return () => {
    return toggleFollow(args)
      .then((res) => {
        if (res.bio) {
          return { creatorsInfo: res };
        } else {
          res = Object.keys(res)
            .map((key) => res[key])
            .join('\n');
          throw new Error(res);
        }
      })
      .catch((error) => {
        if (error.message.startsWith('Unexpected')) {
          CustomToasts({
            type: 'error',
            description: args.t('general.smagError'),
          });
        } else {
          CustomToasts({
            type: 'error',
            description: error.message,
          });
        }

        return { loading: false };
      });
  };
};

/**
 * @function getCategories
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const getAllCategories = (args) => {
  return () => {
    return getCategories()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0 && res[0].name) {
          return { categories: res, loading: false };
        } else {
          res = Object.keys(res)
            .map((key) => res[key])
            .join('\n');
          throw new Error(res);
        }
      })
      .catch((error) => {
        if (error.message.startsWith('Unexpected')) {
          CustomToasts({
            type: 'error',
            description: args.t('general.smagError'),
          });
        } else {
          CustomToasts({
            type: 'error',
            description: error.message,
          });
        }
        return { loading: false };
      });
  };
};

/**
 * @function setZubhub
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const setZubhub = (zubhub) => {
  return (dispatch) => {
    dispatch({
      type: SET_PROJECTS,
      payload: { zubhub },
    });
  };
};

/**
 * @function setHero
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const setHero = (hero) => {
  return (dispatch) => {
    dispatch({
      type: SET_PROJECTS,
      payload: { hero },
    });
  };
};

/**
 * @function getHero
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const getHeroProperties = () => {
  return (dispatch) => {
    return getHero()
      .then((res) => {
        if (res.id || res.title !== undefined) {
          const { header_logo_url, footer_logo_url, site_mode } = res;
          delete res.header_logo_url;
          delete res.footer_logo_url;
          delete res.site_mode;

          dispatch(setHero(res));
          dispatch(setZubhub({ header_logo_url, footer_logo_url, site_mode }));
          return { loading: false };
        } else {
          throw new Error();
        }
      })
      .catch((error) => {
        if (error.message.startsWith('Unexpected')) {
          CustomToasts({
            type: 'error',
            description: t('general.smagError'),
          });
        } else {
          CustomToasts({
            type: 'error',
            description: error.message,
          });
        }
        return { loading: false };
      });
  };
};

/**
 * @function buildPublishTypes
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @description - The order of the publish type options in the publish dropdown
 *   depends on what site_mode the deployment runs. This function helps select
 *   the appropriate order for the publish type options.
 * @param {Object} props.projects - projects redux store.
 * @param {Object} props.values - form values.
 * @returns {Object} - {publish_types:[...]} object with array of publish types as value
 */
export const buildPublishTypes = (zubhub, setProjectData, projectData) => {
  let values = null;
  let publish_types;
  if (zubhub?.site_mode === site_mode.PRIVATE) {
    publish_types = {
      publish_types: [
        {
          value: publish_type['Authenticated Creators'],
          name: 'Authenticated Creators',
        },
        { value: publish_type['Draft'], name: 'Draft' },
        { value: publish_type['Preview'], name: 'Preview' },
        { value: publish_type['Public'], name: 'Public' },
      ],
    };
  } else {
    publish_types = {
      publish_types: [
        { value: publish_type['Public'], name: 'Public' },
        { value: publish_type['Draft'], name: 'Draft' },
        {
          value: publish_type['Authenticated Creators'],
          name: 'Authenticated Creators',
        },
        { value: publish_type['Preview'], name: 'Preview' },
      ],
    };
  }

  //set initial form value for publish if it's undefined
  const publish = {
    type: publish_types.publish_types[0].value,
    visible_to: [],
  };
  setProjectData({ ...projectData, publish: publish });

  return publish_types;
};

/**
 * @function shouldUploadToLocal
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const UploadToLocal = (args) => {
  let result = shouldUploadToLocal(args)
    .then((res) => {
      if (res && res.local === true) {
        return uploadImageToLocal(args);
      } else if (res && res.local === false) {
        return uploadImageToDO(args);
      }
    })

    .catch((error) => {
      CustomToasts({
        type: 'error',
        description: error.message,
      });
    });
  // };
  return result;
};

/**
 * @function uploadImageToLocal
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const uploadImageToLocal = (args) => {
  const formData = new FormData();
  const localUri = args.image.uri;
  const filename = localUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image';

  const data = {
    name: filename,
    uri: localUri,
    type: type,
  };

  formData.append('file', data);
  formData.append('key', `project_images/${nanoid()}`);

  return shouldUploadToLocalPost({
    formData,
    token: args.token,
  })
    .then((res) => {
      if (res.Location) {
        const secure_url = res.Location;
        const public_id = res.Key;

        return { image_url: secure_url, public_id };
      }
    })
    .catch((error) => {
      CustomToasts({
        type: 'error',
        description: error.message,
      });
    });
};

/**
 * @function uploadImageToDO
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const uploadImageToDO = (image, state, props, handleSetState) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: `${doConfig.bucketName}`,
      Key: `${doConfig.project_images}/${nanoid()}`,
      Body: image,
      ContentType: image.type,
      ACL: 'public-read',
    };

    DO.upload(params, (err) => {
      reject(err.message);
    })
      .on('httpUploadProgress', (e) => {
        const progress = Math.round((e.loaded * 100.0) / e.total);
        const { media_upload } = state;
        const upload_info = JSON.parse(
          JSON.stringify(media_upload.upload_info)
        );
        upload_info[image.name] = progress;

        let total = 0;
        Object.keys(upload_info).forEach((each) => {
          total = total + upload_info[each];
        });

        total = total / Object.keys(upload_info).length;

        handleSetState({
          media_upload: {
            ...media_upload,
            upload_info,
            upload_percent: total,
          },
        });
      })
      .send((err, data) => {
        if (err) {
          if (err.message.startsWith('Unexpected')) {
            const error = 'Error in uploading image';
            CustomToasts({
              type: 'error',
              description: 'Error in uploading image',
            });
            reject(error);
          } else {
            reject(err.message);
          }
        } else {
          const secure_url = data.Location;
          const public_id = data.Key;
          resolve({ image_url: secure_url, public_id });
        }
      });
  });
};

/**
 * @function uploadVideo
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const uploadVideo = (args) => {
  if (
    typeof args.video === 'string' &&
    args.video.match(
      /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
    )
  ) {
    return new Promise((r) => r({ secure_url: args.video }));
  } else {
    return shouldUploadToLocal(args).then((res) => {
      if (res && res.local === true) {
        return uploadVideoToLocal(args);
      }
      // else if (res && res.local === false) {
      //   return uploadVideoToCloudinary(video, state, props, handleSetState);
      // }
    });
  }
};

/**
 * @function uploadVideoToLocal
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const uploadVideoToLocal = (args) => {
  let key = nanoid();
  let video = {
    ...args.video,
    name: nanoid(),
    // size: 2239733,
  };

  key = key.slice(0, Math.floor(key.length / 3));
  key = `videos/${slugify(args?.user?.user?.username)}-${slugify(
    video.name
  )}-${key}`;

  const formData = new FormData();
  formData.append('file', video);
  formData.append('key', key);

  return shouldUploadToLocalPost({
    formData,
    token: args.token,
  })
    .then((res) => {
      // console.log(res, 'from upload');
      if (res.secure_url) {
        return { secure_url: res.secure_url };
      }
    })
    .catch((error) => {
      CustomToasts({
        type: 'error',
        description: error.message,
      });

      console.log(err, 'ERROR IN UPLOADING TO LOCAL');
    });
};

/**
 * @function createProject
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const initUpload =
  ({ projectData, imagesDataSet, token, user }) =>
  (dispatch) => {
    let promises = [];

    // upload images
    for (let index = 0; index < imagesDataSet.length; index++) {
      promises.push(UploadToLocal({ token, image: imagesDataSet[index] }));
    }

    if (projectData.video) {
      promises.push(
        uploadVideo({
          token,
          video: projectData.video,
          user,
        })
      );
    }

    Promise.all(promises).then((all) => {
      const uploaded_images_url = [];
      const uploaded_videos_url = [];

      all.forEach((each) => {
        if (each.public_id) {
          uploaded_images_url.push(each);
        } else if (each.secure_url) {
          console.log(each.secure_url, 'secure url');
          uploaded_videos_url[0] = each.secure_url;
        }
      });

      createAProject({
        projectData,
        token,
        uploaded_images_url,
        uploaded_videos_url,
      });
    });
  };

/**
 * @function createProject
 * @author Alice Ndeh<alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const createAProject = ({
  projectData,
  token,
  uploaded_images_url,
  uploaded_videos_url,
}) => {
  return createProject({
    projectData,
    token,
    uploaded_images_url,
    uploaded_videos_url,
  }).then((res) => {
    if (!res.id) {
      throw new Error(JSON.stringify(res));
    } else {
      console.log('successs');
    }
  });
};

/**
 * @function deleteProject
 * @author  Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const deleteAProject = (args) => {
  let response = deleteProject({ token: args.token, id: args.id }).then(
    (res) => {
      if (res.detail !== 'ok') {
        CustomToasts({
          type: 'error',
          description: args.t('projectCard.failedToDeleteProject'),
        });
        throw new Error(res.detail);
      } else {
        CustomToasts({
          type: 'success',
          description: args.t('projectCard.deleteProjectToastSuccess'),
        });
        return true;
      }
    }
  );

  return response;
};

/**
 * @function addComment
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const addAComment = (args) => {
  console.log(args);
  let response = addComment(args)
    .then((res) => {
      if (res.title) {
        console.log(res, 'comment response');
        return { project: res, loading: false };
      } else {
        res = Object.keys(res)
          .map((key) => res[key])
          .join('\n');
        throw new Error(res);
      }
    })
    .catch((error) => {
      console.log(error);
      if (error.message.startsWith('Unexpected')) {
        CustomToasts({
          type: 'error',
          description: args.t('general.smagError'),
        });
      } else {
        CustomToasts({
          type: 'error',
          description: error.message,
        });
      }
    });

  return response;
};
