import axios from 'axios';
import { from } from 'rxjs';

// import env from '@root/env.json';
// import * as CODE from '@src/constants/code';

export const YOUTUBE_DATA_API_KEY = 'AIzaSyCxeCIxzvgrAhmH79QWRy8Y1Jew0GD1L64';
export const PLAY_LIST_ID = 'FL-mhB5Q4QfGaY249PUrPJtQ';
export const YOUTUBE_DATA_PLAYLIST_ITEMS_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';
export const YOUTUBE_DATA_PLAYLIST_URL = 'https://www.googleapis.com/youtube/v3/playlists';
export const YOUTUBE_DATA = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=30&playlistId=${PLAY_LIST_ID}&key=${YOUTUBE_DATA_API_KEY}`;

const service = axios.create({
  baseURL: YOUTUBE_DATA_PLAYLIST_URL,
  timeout: 30000,
  headers: {
    'content-type': 'application/json;charset=UTF-8',
  },
});

service.interceptors.request.use(
  req => {
    console.log('youtube data api request', req);
    console.info('youtube data api request', JSON.stringify({
      url: `${req.baseURL}`,
      method: req.method,
      params: req.params,
      data: req.data,
    }));
    return req;
  }
);

service.interceptors.response.use(
  res => {
    console.log('network response suceess config = ', res);
    console.info('youtube data api resp', JSON.stringify({
      status: res.status,
      url: res.config.url,
    }));
    const data = res.data || undefined;
    return Promise.resolve(data);
  },
  error => {
    let code = '';
    let message = '';

    const { response } = error;
    // const { status } = error.response;
    console.log('network response failure error respons e= ', response);

    if (!error.response) {
      // code = CODE.NETWORK_ERROR;
    } else if (error.response.data) {
      code = error.response.data.code;
      message = error.response.data.message;
    } else {
      code = error.response.status;
    }

    console.warn('youtube data api resp', JSON.stringify({
      status: error.response && error.response.status,
      code,
      message,
      url: error.config.url,
    }));
    error.code = code;
    return Promise.reject(error);
  }
);

export const request = config => from(service(config));
