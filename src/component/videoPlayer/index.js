/* eslint-disable max-len */
/* eslint-disable react/sort-comp */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import YoutubeWebviewPlayer from './YoutubeWebviewPlayer';
import promiseCancelable from '../../utils/promiseCancelable';
import { Subtitle } from '../../model/subtitleEntity';

const styles = StyleSheet.create({
  playerTouchView: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    aspectRatio: 16 / 9,
  },
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'stretch',
  },
  mask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    opacity: 0.5,
  },
});

// const defaultLoadingBackground = require('../../assets/images/video/default_loading_background.png');
// const playIcon = require('../../assets/images/video/ic_common_videoplay.png');

export const PLAYER_ERROR = {
  forbidden_auth: '403',
  buffering_fail: '901',
  webview_load_fail: '902',
};

const ANDROID_FROZEN_THRESHOLD = 1.2;

class VideoPlayer extends Component {
  constructor(props) {
    super(props);
    this.player = React.createRef();

    this.state = {
      showNotPlayingView: true,
      subtitleReady: false,
      playerReady: false,
      disablePlayerTouchEvent: true,
      uninstall: false,
      videoId: this.props.videoId,
      thumbnailUrl: undefined,
      isStartPointTime: true,
      source: undefined,
    };

    this.subtitleList = [];
    this.repeatSentenceToggle = this.props.repeatSentence;
    this.targetSentenceIndex = -1;
    this.playing = false;
    this.duration = 0;
    this.repeatLock = false;
    this.seekLock = false;
    this.videoPlayer = null;
    this.notPlayingView = null;
    this.allReady = false;
  }

  componentDidMount() {
    // this.getVideoInformation();
  }

  componentDidUpdate() {
    const { playerReady, subtitleReady } = this.state;
    if (!this.allReady && subtitleReady && playerReady) {
      this.allReady = true;
      this.props.onAllReady();
    }
  }

  componentWillUnmount() {
    this.stop();
    if (this.getVideoInfoPromise) {
      this.getVideoInfoPromise.cancel();
    }
  }

  onReady = (ready) => {
    // console.log('video is ready :', ready);
    if (!ready) {
      return;
    }

    this.setState({
      disablePlayerTouchEvent: false,
      playerReady: true,
    });
    this.props.onPlayerReady(ready);
  }

  onVideoEnd = () => {
    // console.log('onVideoEnd');
    /**
     * https://hopenglish.atlassian.net/browse/CS-302
     */
    if (this.repeatLock || this.repeatSentenceToggle) {
      // console.log('onVideoEnd but wanna repeat sentence!');
      if (this.repeatSentenceToggle && !this.repeatLock) {
        // console.log('video is end, so need to seek the specific sentence index');
        this.seekTo(this.repeatStartTime, this.props.seekAndPause);
      }
      return;
    }
    this.resetPlayer();
    this.showNotPlayingView(true);

    this.props.onVideoEnd();
  }

  onCurrentTimeChange = (s) => {
   
  }

  onDurationChange = (durationTime) => {
    // console.log('video duration :', durationTime);
    this.duration = durationTime;
    this.props.onDurationChange(durationTime);
  }

  onPlayingChange = (playingState) => {
    // console.log('onPlayingChange is playing ?', playingState);
    // if (this.isFreezeMode && playingState) {
    //   console.log('onPlayingChange video player this.isFreezeMode play ?', this.isFreezeMode, playingState);
    //   this.pause();
    // }
    if (this.playing !== playingState) {
      this.repeatLock = false;
    }
    this.playing = playingState;
    this.props.onPlayingChange(playingState);
  }

  onPlayerError = (error, ytIFrameError = false) => {
    // console.log('onPlayerError ytIFrameError ? ', ytIFrameError);
    this.props.onError(error);
  }

  clickPlayerScreen = () => {
    if (!this.props.clickPlayerScreen) {
      if (this.playing) {
        this.pause();
      } else {
        this.play();
      }
      return;
    }

    this.props.clickPlayerScreen();
  }

  play = () => {
    this.isFreezeMode = false;
    if (this.playing || !this.player.current) {
      return;
    }
    this.props.onWillPlay();
    this.player.current.playVideo();
    this.showNotPlayingView(false);
  }

  pause = () => {
    this.isFreezeMode = true;
    if (!this.playing || !this.player.current) {
      return;
    }
    this.props.onWillPause();
    this.player.current.pauseVideo();
    this.showNotPlayingView(true);
  }

  stop = () => {
    this.isFreezeMode = true;
    if (!this.player.current) {
      return;
    }
    this.player.current.stopVideo();
  }

  seekTo = (seconds = 0, pause = false) => {
    // console.log('videoPlayer seekTo, pause :', seconds, pause);
    if (!this.player || !this.player.current) {
      return;
    }

    this.seekLock = true;
    this.player.current.seekTo(seconds);
  }

  showNotPlayingView = (show) => {
    this.setState({ showNotPlayingView: show });
  }

  seekBySentenceIndex = (index, pause = false) => {
    if (!this.subtitleList || !this.subtitleList[index]) {
      return;
    }

    if (index >= 0 && index < this.subtitleList.length) {
      this.targetSentenceIndex = index;
      this.seekTo(this.subtitleList[index].startSeconds, pause);
    }
  }

  replay = () => {
    this.resetPlayer();
    this.seekTo(0);
    this.play();
  }

  forward = () => {
    const nextIndex = this.targetSentenceIndex + 1;

    if (this.isBeyondLastSentence(nextIndex)) {
      this.props.isForwardToLastSentence();
      return;
    }

    if (nextIndex === this.subtitleList.length - 1) {
      this.props.isForwardToLastSentence();
    }

    this.targetSentenceIndex = nextIndex;
    this.seekBySentenceIndex(this.targetSentenceIndex);
    this.updateSubtitle(this.targetSentenceIndex);
  }

  backward = () => {
    const previousIndex = this.targetSentenceIndex - 1;

    if (previousIndex <= -1) {
      this.props.isBackwardToFirstSentence();
      return;
    }

    if (previousIndex === 0) {
      this.props.isBackwardToFirstSentence();
    }

    this.targetSentenceIndex = previousIndex;
    this.seekBySentenceIndex(this.targetSentenceIndex);
    this.updateSubtitle(this.targetSentenceIndex);
  }

  setRepeatSentenceToggle = (repeat) => {
    this.repeatSentenceToggle = repeat;
  }

  isBeyondLastSentence = (index) => {
    if (!this.subtitleList) {
      return;
    }
    // eslint-disable-next-line consistent-return
    return index === this.subtitleList.length;
  }

  setThumbnail = (thumbnail) => {
    this.setState({
      thumbnailUrl: thumbnail,
    });
  }

  setVideoId = (videoId) => {
    this.setState({
      videoId,
    });
  }

  getVideoPlayer = (videoSource, videoId) => {
    switch (videoSource) {
      default:
        return this.youtubeIFramePlayer(videoId);
    }
  }

  youtubeIFramePlayer = videoId => (
    <YoutubeWebviewPlayer
      ref={this.player}
      videoId={videoId}
      onReady={ready => this.onReady(ready)}
      onVideoEnd={() => this.onVideoEnd()}
      getCurrentTime={time => this.onCurrentTimeChange(time)}
      getDuration={time => this.onDurationChange(time)}
      onPlayingChange={play => this.onPlayingChange(play)}
      onPlayerError={error => this.onPlayerError(error)}
    />
  )

  getPlayerCoverScreen = (showNotPlayingView, videoPicUrl) => {
    if (!showNotPlayingView) {
      return null;
    }

    if (this.props.playerPauseView) {
      // console.log('playerPauseView :');
      return this.props.playerPauseView(videoPicUrl);
    }

    const {
      isStartPointTime,
    } = this.state;

    return (
      <View style={styles.wrapper}>
        {isStartPointTime &&
        <Image
          style={[
                styles.thumbnail,
              ]}
          source={{ uri: videoPicUrl }}
          resizeMode="cover"
          fadeDuration={0}
        />}

        <View style={styles.mask} />

        <Image
          source={playIcon}
          fadeDuration={0}
        />
      </View >
    );
  }

  render() {
    const {
      showNotPlayingView,
      thumbnailUrl,
      disablePlayerTouchEvent,
      videoId,
    } = this.state;

    if (videoId) {
      this.videoPlayer = this.getVideoPlayer(videoId);
    }
    this.notPlayingView = this.getPlayerCoverScreen(showNotPlayingView, thumbnailUrl);

    return (
      <TouchableOpacity
        style={styles.playerTouchView}
        activeOpacity={1}
        onPress={this.clickPlayerScreen}
        disabled={disablePlayerTouchEvent}
      >
        {this.videoPlayer}
        {this.notPlayingView}
      </TouchableOpacity>
    );
  }
}

VideoPlayer.propTypes = {
  postId: PropTypes.string.isRequired,
  source: PropTypes.string,
  videoId: PropTypes.string,
  onPlayerReady: PropTypes.func,
  repeatSentence: PropTypes.bool,
  clickPlayerScreen: PropTypes.func,
  onSubtitleChange: PropTypes.func,
  onLastSentenceCallback: PropTypes.func,
  onSentenceEndCallback: PropTypes.func,
  onError: PropTypes.func,
  onErrorWithBufferFail: PropTypes.func,
  onVideoEnd: PropTypes.func,
  isBackwardToFirstSentence: PropTypes.func,
  isForwardToLastSentence: PropTypes.func,
  playerPauseView: PropTypes.func,
  onWillPlay: PropTypes.func,
  onWillPause: PropTypes.func,
  onPlayingChange: PropTypes.func,
  onCurrentSentenceIndex: PropTypes.func,
  onHandleVideoSubtitles: PropTypes.func,
  onDurationChange: PropTypes.func,
  onAllReady: PropTypes.func,
  onCurrentTimeChange: PropTypes.func,
  onStartPointTime: PropTypes.func,
  seekAndPause: PropTypes.bool,
};

VideoPlayer.defaultProps = {
  repeatSentence: false,
  videoId: undefined,
  source: undefined,
  onLastSentenceCallback: () => {},
  onSentenceEndCallback: () => {},
  onError: () => {},
  onErrorWithBufferFail: () => {},
  onVideoEnd: () => {},
  isBackwardToFirstSentence: () => {},
  isForwardToLastSentence: () => {},
  onWillPlay: () => {},
  onWillPause: () => {},
  onPlayingChange: () => {},
  onCurrentSentenceIndex: () => {},
  onSubtitleChange: undefined,
  clickPlayerScreen: undefined,
  playerPauseView: undefined,
  onHandleVideoSubtitles: () => {},
  onDurationChange: () => {},
  onPlayerReady: () => {},
  onAllReady: () => {},
  onCurrentTimeChange: () => {},
  onStartPointTime: () => {},
  seekAndPause: false,
};

export default VideoPlayer;
