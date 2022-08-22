import AWS from 'aws-sdk';

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
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const buildVideoThumbnailURL = (video_url) => {
  if (video_url.includes('youtube.com/embed/')) {
    const id = video_url.split('youtube.com/embed/')[1];
    return `https://img.youtube.com/vi/${id}/0.jpg`;
  } else if (video_url.includes('player.vimeo.com/video/')) {
    const id = video_url.split('player.vimeo.com/video/')[1];
    return `https://vumbnail.com/${id}.jpg`;
  } else if (video_url.includes('drive.google.com')) {
    let id = video_url.split('/');
    id = id[id.length - 2];
    return `https://lh3.googleusercontent.com/d/${id}=s300`;
  } else if (video_url.includes('cloudinary.com')) {
    if (video_url.includes('upload/sp_hd')) {
      return video_url.replace('upload/sp_hd', 'upload/f_jpg');
    } else if (video_url.includes('upload')) {
      return video_url.replace('upload', 'upload/f_jpg');
    } else {
      return video_url;
    }
  } else {
    return video_url + '.jpg';
  }
};

/**
 * @constant doConfig
 * @author Alice Ndeh <alicendeh16@gmail.com>
 *
 * @todo - describe constant's function
 */
export const doConfig = {
  digitalOceanSpaces: 'https://zubhub.sfo2.digitaloceanspaces.com/',
  bucketName: 'zubhub',
  project_images: 'project_images',
};

/**
 * @object s3
 * @author Alice Ndeh<alicendeh16@gmail.com>
 *
 * @todo - describe object's function
 */
export const s3 = new AWS.S3({
  endpoint: new AWS.Endpoint('sfo2.digitaloceanspaces.com'),
  accessKeyId: process.env.REACT_APP_DOSPACE_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_DOSPACE_ACCESS_SECRET_KEY,
});

/**
 * @function Compress
 * @author Alice Ndeh<alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const Compress = (images, state, handleSetState) => {
  let compressed = [];

  for (let index = 0; index < images.length; index += 1) {
    let image = images[index];

    if (image && image.type.split('/')[1] !== 'gif') {
      new Compressor(image, {
        quality: 0.6,
        convertSize: 100000,
        success: (result) => {
          compressed.push(result);
          shouldSetImages(compressed, images, state, handleSetState);
        },
        error: (error) => {
          console.warn(error.message);
          compressed.push(image);
          shouldSetImages(compressed, images, state, handleSetState);
        },
      });
    } else {
      compressed.push(image);
      shouldSetImages(compressed, images, state, handleSetState);
    }
  }
};

/**
 * @function slugify
 * @author Alice Ndeh<alicendeh16@gmail.com>
 *
 * @todo - describe function's signature
 */
export const slugify = (str) => {
  return str.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
};
