import { GoogleSignin, GoogleSigninButton, statusCodes } from 'react-native-google-signin';
import VideoPlayer from './src/component/videoPlayer/YoutubeWebviewPlayer';
import {
  YOUTUBE_DATA_API_KEY,
  PLAY_LIST_ID,
  request,
  YOUTUBE_DATA_PLAYLIST_URL,
} from './src/network/yotubeService';
import React, {Fragment} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
} from 'react-native';

import {
  // Header,
  // LearnMoreLinks,
  Colors,
  // DebugInstructions,
  // ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

const signIn = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    console.log('signIn userInfo', userInfo);
    const tokens = await GoogleSignin.getTokens();
    console.log('signIn tokens', tokens);
    this.accessToken = tokens.accessToken;
  } catch (error) {
    console.log('signIn error', error);
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // user cancelled the login flow
    } else if (error.code === statusCodes.IN_PROGRESS) {
      // operation (f.e. sign in) is in progress already
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      // play services not available or outdated
    } else {
      // some other error happened
    }
  }
};

const App = () => {
  this.playerRef = React.createRef();
  GoogleSignin.configure({
    scopes: ['https://www.googleapis.com/auth/youtube.readonly'], // what API you want to access on behalf of the user, default is email and profile
    // webClientId: '886572757234-4p7kgr5kj8h7fanrtmod4b9kjthk1de3.apps.googleusercontent.com',
    offlineAccess: false, // if you want to access Google API on behalf of the user FROM YOUR SERVER
    // hostedDomain: '', // specifies a hosted domain restriction
    // loginHint: '', // [iOS] The user's ID, or email address, to be prefilled in the authentication UI if possible. [See docs here](https://developers.google.com/identity/sign-in/ios/api/interface_g_i_d_sign_in.html#a0a68c7504c31ab0b728432565f6e33fd)
    // forceConsentPrompt: true, // [Android] if you want to show the authorization prompt at each login.
    // accountName: '', // [Android] specifies an account name on the device that should be used
    iosClientId: '886572757234-oq10qt4kvp89bbi39p9ntjqv05evrasu.apps.googleusercontent.com', // [iOS] optional, if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
  });
  return (
    <Fragment>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <VideoPlayer ref={ref => (this.playerRef = ref)} />

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          {/* <Header /> */}
          <View style={styles.body}>
            <TouchableOpacity
              onPress={() => {
                this.playerRef.playVideo();
              }}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>play</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                this.playerRef.pauseVideo();
              }}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>pause</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                request({
                  method: 'GET',
                  params: {
                    // baseURL: YOUTUBE_DATA_PLAYLIST_URL,
                    part: 'snippet, contentDetails',
                    maxResults: '25',
                    mine: true,
                    key: YOUTUBE_DATA_API_KEY,
                    // access_token: this.accessToken,
                  },
                  headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                  },
                });
              }}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>get playlist</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                request({
                  method: 'GET',
                  params: {
                    part: 'snippet',
                    maxResults: '30',
                    playlistId: PLAY_LIST_ID,
                    key: YOUTUBE_DATA_API_KEY,
                  },
                });
              }}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>get playlistitems</Text>
              </View>
            </TouchableOpacity>

            <GoogleSigninButton
              style={{ width: 192, height: 48 }}
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Dark}
              onPress={() => {signIn()}}
              // disabled={this.state.isSigninInProgress} 
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Fragment>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
