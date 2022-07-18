export const dFormatter = (str) => {
  const date = new Date(str);

  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;

  if (interval > 1) {
    let result = Math.round(interval);
    return { value: result, key: result > 1 ? 'years' : 'year' };
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    let result = Math.round(interval);
    return { value: result, key: result > 1 ? 'months' : 'month' };
  }
  interval = seconds / 86400;
  if (interval > 1) {
    let result = Math.round(interval);
    return { value: result, key: result > 1 ? 'days' : 'day' };
  }
  interval = seconds / 3600;
  if (interval > 1) {
    let result = Math.round(interval);
    return { value: result, key: result > 1 ? 'hours' : 'hour' };
  }
  interval = seconds / 60;
  if (interval > 1) {
    let result = Math.round(interval);
    return { value: result, key: result > 1 ? 'minutes' : 'minute' };
  }
  let result = Math.round(interval);
  return { value: result, key: result > 1 ? 'seconds' : 'second' };
};

/**
 * @function buildVideoThumbnailURL
 * @author Raymond Ndibe <ndiberaymond1@gmail.com>
 *
 * @todo - describe function's signature
 */
export const buildVideoThumbnailURL = (video_url) => {
  if (video_url.search('youtube.com/embed/') > -1) {
    const id = video_url.split('youtube.com/embed/')[1];
    return `https://img.youtube.com/vi/${id}/0.jpg`;
  } else if (video_url.search('player.vimeo.com/video/') > -1) {
    const id = video_url.split('player.vimeo.com/video/')[1];
    return `https://vumbnail.com/${id}.jpg`;
  } else if (video_url.search('drive.google.com') > -1) {
    let id = video_url.split('/');
    id = id[id.length - 2];
    return `https://lh3.googleusercontent.com/d/${id}=s300`;
  } else if (video_url.search('cloudinary.com') > -1) {
    if (video_url.search('upload/sp_hd') > -1) {
      return video_url.replace('upload/sp_hd', 'upload/f_jpg');
    } else if (video_url.search('upload') > -1) {
      return video_url.replace('upload', 'upload/f_jpg');
    } else {
      return video_url;
    }
  } else {
    return video_url + '.jpg';
  }
};
