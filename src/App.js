import React, { Component } from 'react';
import hash from './hash';
import { authEndpoint, clientID, redirectURI, scopes } from "./user-config";
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token: "",
      deviceId: "",
      error: "",
      trackName: "Track Name",
      artistName: "Artist Name",
      albumName: "Album Name",
      playing: false,
      albumArt: "",
      uri: "spotify:playlist:6M4ZbVjkSE6P3IhbeYbnhc",
    };
    this.playerCheckInterval = null;
  }

  componentDidMount() {
    let _token = hash.access_token;
    if (_token) {
      this.setState({
        token: _token
      });
      this.playerCheckInterval = setInterval(() => this.checkForPlayer(), 1000);
      console.log(this.state.token);
    }
  }

  checkForPlayer() {
    const { token } = this.state;

    if (window.Spotify !== null) {
      clearInterval(this.playerCheckInterval);

      this.player = new window.Spotify.Player({
        name: "Song Player",
        getOAuthToken: cb => { cb(token); },
      });
      this.createEventHandlers();

      this.player.connect();
    }
  }

  createEventHandlers() {
    this.player.on('initialization_error', e => { console.error(e); });
    this.player.on('authentication_error', e => {console.error(e);});
    this.player.on('account_error', e => { console.error(e); });
    this.player.on('playback_error', e => { console.error(e); });

    this.player.on('player_state_changed', state => this.onStateChanged(state));

    this.player.on('ready', async data => {
      let { device_id } = data;
      console.log("Let the music play on!");
      await this.setState({ deviceId: device_id });
      this.transferPlaybackHere()
    });
  }

  onStateChanged(state) {
    if (state !== null) {
      const {
        current_track: currentTrack,
      } = state.track_window;
      const trackName = currentTrack.name;
      const albumName = currentTrack.album.name;
      const albumArt = currentTrack.album.images[0].url;
      const artistName = currentTrack.artists
          .map(artist => artist.name)
          .join(", ");
      const playing = !state.paused;
      this.setState({
        trackName,
        albumName,
        artistName,
        playing,
        albumArt,
      });
    }
  }

  onPrevClick() {
    this.player.previousTrack();
  }

  onPlayClick() {
    this.player.togglePlay();
  }

  onNextClick() {
    this.player.nextTrack();
  }

  transferPlaybackHere() {
    const { deviceId, token, uri} = this.state;
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ "context_uri": uri}),
    });
  }

  render() {
    const {
      token,
      error,
      trackName,
      artistName,
      albumName,
      playing,
      albumArt,
    } = this.state;

    return (
        <div className="App">
          {error && <p>You have an error! : {error}</p> }
          <div className="Web-header">
            Mood Music
          </div>
          {token ? (<div>
            <div className="App-header" id="loggedIn">
              <h2>Now Playing</h2>
              <img className="album" alt={"Album Cover"} src={albumArt} />
            </div>
            <div className="Artist-info">
            <p>Artist: {artistName}</p>
            <p>Track: {trackName}</p>
            <p>Album: {albumName}</p>
            <p>
              <button onClick={() => this.onPrevClick()}>Previous</button>
              <div className={"divider"}/>
              <button onClick={() => this.onPlayClick()}>{playing ? "Pause" : "Play"}</button>
              <div className={"divider"}/>
              <button onClick={() => this.onNextClick()}>Next</button>
            </p>
          </div></div>) : (<div>
            <div className="App-header">
            <h2>Authentication</h2>
            </div>
            <div className="Token-info">
            <a
            className="login"
            href={`${authEndpoint}client_id=${clientID}&redirect_uri=${redirectURI}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`}
            >
            Login to Spotify!
            </a>
            </div></div>)}
        </div>

    );
  }
}

export default App;
