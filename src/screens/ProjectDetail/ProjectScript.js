/**
 * @function isCloudinaryVideo
 * @author Raymond Ndibe <ndiberaymond1@gmail.com>
 *
 * @todo - describe function's signature
 */
export const isCloudinaryVideo = (url) =>
  url.search('cloudinary.com') > -1 ? true : false;

/**
 * @function isGdriveORVimeoORYoutube
 * @author Raymond Ndibe <ndiberaymond1@gmail.com>
 *
 * @todo - describe function's signature
 */
export const isGdriveORVimeoORYoutube = (url) => {
  if (
    url.search('youtube.com/embed/') > -1 ||
    url.search('player.vimeo.com/video/') > -1 ||
    url.search('drive.google.com') > -1
  ) {
    return true;
  } else {
    return false;
  }
};
