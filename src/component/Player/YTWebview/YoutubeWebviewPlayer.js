/* eslint-disable react/sort-comp */
/* eslint-disable no-unneeded-ternary */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { WebView } from 'react-native-webview';
import { View, Platform, Dimensions } from 'react-native';
// import authStore from '../../../hocs/authStore';
// import { config } from '../../../configs/config';
// import { getFirstNumberSystemVersion, getSecondNumberSystemVersion } from '../../../utils/deviceUtils';
// import { PLAYER_ERROR } from '../videoPlayer';
import YTPlayerHtml from './yt';

const YOUTUBE_PLAYER_STATE = {
  UNSTARTED: '-1',
  ENDED: '0',
  PLAYING: '1',
  PAUSED: '2',
  BUFFERING: '3',
  VIDEO_CUED: '5',
};

const PLAYER_CALLBACK = {
  onPlayerReady: 'onPlayerReady',
  onPlayerStateChange: 'onPlayerStateChange',
  onPlayerError: 'onPlayerError',
  playVideo: 'playVideo',
  pauseVideo: 'pauseVideo',
  stopVideo: 'stopVideo',
  seekTo: 'seekTo',
  getCurrentTime: 'getCurrentTime',
  getDuration: 'getDuration',
};

const BRIDGE_PATTERN = '_';
const CURRENT_TIME_RATE_MS = 50;
// const YT_IFRAME_URI = `${config.BASE_URL}/youtube_loader`;

const screenWidth = Dimensions.get('window').width;
const screenHeight = screenWidth * (9 / 16);

class WebviewPlayer extends Component {
  constructor(props) {
    super(props);
    this.player = React.createRef();

    this.currentTimer = undefined;
    this.videoDuration = -1;
    this.playing = false;
    this.ready = false;
    this.playErrorCount = 0;
  }

  componentDidMount() {
    console.log('yt webviewPlayer did mount');
  }

  componentWillUnmount() {
    this.removeCurrentTimer();
  }

  onMessage = (event) => {
    const { data } = event.nativeEvent;
    const webViewMessage = data.split(BRIDGE_PATTERN);
    console.log('onMessage webViewMessage : ', webViewMessage);
    const functionName = webViewMessage[0];
    const carriedData = webViewMessage[1];

    switch (functionName) {
      case PLAYER_CALLBACK.onPlayerReady:
        this.onReadyFired();
        break;

      case PLAYER_CALLBACK.onPlayerStateChange:
        this.handleStateChange(carriedData);
        break;

      case PLAYER_CALLBACK.seekTo:
        break;

      case PLAYER_CALLBACK.getCurrentTime:
        this.onCurrentTimeChange(carriedData);
        break;

      case PLAYER_CALLBACK.getDuration:
        this.videoDuration = carriedData;
        this.onDurationChange(this.videoDuration);
        break;

      case PLAYER_CALLBACK.onPlayerError:
        this.onPlayError(carriedData);
        break;


      default:
        // console.log('no match');
    }
  }

  onReadyFired = () => {
    if (this.ready) {
      return;
    }

    this.ready = true;
    this.props.onReady(true);
  }

  onVideoEnd = () => {
    this.props.onVideoEnd();
  }

  onBuffering = () => {

  }

  onPlayerStateChange = () => {
    this.props.onPlayerStateChange(true);
  }

  onCurrentTimeChange = (currentTime) => {
    // console.log('webview currentTime :', currentTime);
    this.props.getCurrentTime(currentTime);
  }

  onDurationChange = (duration) => {
    this.props.getDuration(duration);
  }

  onPlayingChange = (play) => {
    this.props.onPlayingChange(play);
  }

  onPlayError = (error) => {
    // when receive the times of msg larger than one, return it.
    if (this.playErrorCount > 1) {
      return;
    }
    // console.log('webview player error :', error);
    this.playErrorCount++;
    this.props.onPlayerError(error, true);
  }

  // eslint-disable-next-line no-unused-vars
  onError = (error) => {
    console.warn('webview onError:', error);
  }

  requestCurrentTime = () => {
    if (this.currentTimer) {
      return;
    }

    // console.log('currentTimer init');
    this.currentTimer = setInterval(() => {
      if (this.playing && this.player.current) {
        // this.player.current.postMessage(PLAYER_CALLBACK.getCurrentTime);
        this.postMessage(PLAYER_CALLBACK.getCurrentTime);
      }
    }, CURRENT_TIME_RATE_MS);
  }

  removeCurrentTimer = () => {
    if (this.currentTimer) {
      clearInterval(this.currentTimer);
      this.currentTimer = null;
    }
  }

  requestDuration = () => {
    if (this.videoDuration >= 0) {
      return;
    }
    // console.log('getDuration init');
    // this.player.current.postMessage(PLAYER_CALLBACK.getDuration);
    this.postMessage(PLAYER_CALLBACK.getDuration);
  }

  resetPlayer = () => {
    this.currentTimer = undefined;
    this.ready = false;
    this.videoDuration = -1;
    this.playing = false;
  }

  handleStateChange = (data) => {
    // console.log('handleStateChange data', data);
    if (data !== YOUTUBE_PLAYER_STATE.PLAYING) {
      this.playing = false;
      this.onPlayingChange(false);
    }

    switch (data) {
      case YOUTUBE_PLAYER_STATE.UNSTARTED:
        this.onReadyFired();
        this.requestDuration();
        break;

      case YOUTUBE_PLAYER_STATE.ENDED:
        this.onVideoEnd();
        break;

      case YOUTUBE_PLAYER_STATE.PLAYING:
        this.playing = true;
        this.requestCurrentTime();
        this.onPlayingChange(true);
        break;

      case YOUTUBE_PLAYER_STATE.PAUSED:
        break;

      case YOUTUBE_PLAYER_STATE.BUFFERING:
        this.onBuffering();
        break;

      case YOUTUBE_PLAYER_STATE.VIDEO_CUED:
        this.removeCurrentTimer();
        break;

      default:
        console.log('no match', data);
    }
  }

  seekTo = (seconds) => {
    // console.log('before post to webview seekTo :', seconds);
    if (!this.player.current) { return; }

    this.postMessage(PLAYER_CALLBACK.seekTo, seconds);
  }

  playVideo = () => {
    console.log('playVideo');
    if (!this.player.current) { return; }
    this.postMessage(PLAYER_CALLBACK.playVideo);
  }

  pauseVideo = () => {
    console.log('pauseVideo');
    if (!this.player.current) { return; }

    this.postMessage(PLAYER_CALLBACK.pauseVideo);
  }

  stopVideo = () => {
    if (!this.player.current) { return; }

    this.postMessage(PLAYER_CALLBACK.stopVideo);
  }

  postMessage = (method, payload) => {
    const msg = JSON.stringify({
      // id: new Date().getTime(),
      method,
      payload,
    });
    const run = `window.handleReactNativeMessage({ data: '${msg}'});`;
    this.player.current.injectJavaScript(run);
  }

  render() {
    let webviewComponent = (
      <WebView
        ref={this.player}
        // injectedJavascript={injectedJavascript}
        onMessage={this.onMessage}
        useWebKit
        onError={this.onError}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        source={{
          // html: YTPlayerHtml(this.props.videoId, screenWidth, screenHeight),
          // headers: {'referer': 'https://youtube.com/'},
          uri: `https://movie2019.appspot.com/?video_id=${this.props.videoId}`,
        }}
      />
    );

    return (
      <View
        style={{
          aspectRatio: 16 / 9,
        }}
        pointerEvents="none"
      >
        {webviewComponent}
      </View>
    );
  }
}

WebviewPlayer.propTypes = {
  videoId: PropTypes.string.isRequired,
  onReady: PropTypes.func,
  onVideoEnd: PropTypes.func,
  onPlayerStateChange: PropTypes.func,
  getCurrentTime: PropTypes.func,
  getDuration: PropTypes.func,
  onPlayingChange: PropTypes.func,
  onPlayerError: PropTypes.func,
  forward: PropTypes.func,
  backward: PropTypes.func,
};

WebviewPlayer.defaultProps = {
  onReady: () => false,
  onVideoEnd: () => {},
  onPlayerStateChange: () => null,
  getCurrentTime: () => 0,
  getDuration: () => -1,
  onPlayingChange: () => false,
  onPlayerError: () => {},
  forward: () => {},
  backward: () => {},
};

export default WebviewPlayer;
