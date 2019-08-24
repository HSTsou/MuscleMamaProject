export default function YTPlayerHtml(
  videoID,
  width = '100%',
  height = '100%',
) {
  const html =
      `<!DOCTYPE html>
      <html>
      <head>
      <meta name="viewport" content="initial-scale=1.0">
      </head>
      <body style="margin: 0px;background-color:#000;">
          <div id="player"></div>
          <script>
            var tag = document.createElement('script');
    
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    
            var player;
            var PLAYER_CALLBACK = {
              playVideo: 'playVideo',
              pauseVideo: 'pauseVideo',
              stopVideo: 'stopVideo',
              seekTo: 'seekTo',
              getCurrentTime: 'getCurrentTime',
              getDuration: 'getDuration',
            };

            function onYouTubeIframeAPIReady() {
              player = new YT.Player('player', {
                  playerVars: {
                      'rel': 0,
                      'fs': 0,
                      'playsinline': 1,
                      'autoplay': 0,
                      'iv_load_policy': 3,
                      'showinfo': 0,
                      'enablejsapi': 1,
                      'controls': 0,
                      'modestbranding': 1,  
                      'origins':'http://example.com',
                  },
                  height: '${height}',
                  width: '${width}',
                  videoId: '${videoID}',
                  events: {
                      'onStateChange': onPlayerStateChange,
                      'onError': onPlayerError,
                      'onReady': onPlayerReady,
                  }
              });
            }

            function handleReactNativeMessage (event) {
              try {
                var data = JSON.parse(event.data);
                var method = data.method;
                var payload = data.payload;
                handleRNEvent(method, payload);
              } catch (err) {
                console.warn(err);
              }
            }

            function handleRNEvent (method, payload) {
              switch (method) {
                case PLAYER_CALLBACK.playVideo: 
                    playVideo(); 
                    break;
                case PLAYER_CALLBACK.pauseVideo:
                    pauseVideo(); 
                    break;
                case PLAYER_CALLBACK.stopVideo:
                    stopVideo();
                    break;
                case PLAYER_CALLBACK.getCurrentTime:
                    getCurrentTime();
                    break;
                case PLAYER_CALLBACK.getDuration:
                    getDuration();
                    break;    
                case PLAYER_CALLBACK.seekTo:
                    seekTo(payload);
                    break; 
              }
            }

            function sendMessageToReactNative (method, payload) {
              var msg = JSON.stringify({
                id: new Date().getTime(),
                method,
                payload,
              });

              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(msg);
              }
            }
    
            function onPlayerStateChange(event) {
              window.ReactNativeWebView.postMessage("onPlayerStateChange_" + JSON.stringify(event.data))
            }
  
            function onPlayerReady(event) {
              window.ReactNativeWebView.postMessage("onPlayerReady_");

              // walk around: avoiding to the Buffering state forever resulted by executing seekTo() at the first time.
              // seekTo(0); 
              
              // walk around: RN webview postMessage cannot immediately exectue when iframe set up.
              // setTimeout(() => { 
              //   window.postMessage("onPlayerReady_")       
              // }, 300);
            }
  
            function onPlayerError(event) {
              window.ReactNativeWebView.postMessage("onPlayerError_" + JSON.stringify(event.data))
            }
  
            function playVideo() {
              player.playVideo();
            }
  
            function pauseVideo() {
              player.pauseVideo();
            }
  
            function stopVideo() {
              player.stopVideo();
            }
  
            function seekTo(seconds) {
              player.seekTo(seconds, true);
              window.ReactNativeWebView.postMessage("seekTo_" + seconds)
            }
  
            function getCurrentTime() {
              var time = player.getCurrentTime();
              window.ReactNativeWebView.postMessage("getCurrentTime_" + JSON.stringify(time))
            }
  
            function getDuration() {
              var time = player.getDuration();
              window.ReactNativeWebView.postMessage("getDuration_" + JSON.stringify(time))
            }
          </script>
      </body>
      </html>`;
  return html;
}
