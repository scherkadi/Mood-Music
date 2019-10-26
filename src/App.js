import React, { Component } from 'react';
import logo from './logo.svg';
import hash from './hash';
import { authEndpoint, clientID, redirectURI, scopes } from "./user-config";
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token: "",
      deviceId: "",
      loggedIn: false,
      error: "",
      trackName: "Track Name",
      artistName: "Artist Name",
      albumName: "Album Name",
      playing: false,
      position: 0,
      duration: 0,
      albumArt: "",
      uri: "spotify:playlist:6M4ZbVjkSE6P3IhbeYbnhc",
    };
    this.playerCheckInterval = null;
  }

  handleLogin() {
    if (this.state.token !== "") {
      this.setState({ loggedIn: true });

      this.playerCheckInterval = setInterval(() => this.checkForPlayer(), 1000);
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

      // finally, connect!
      this.player.connect();
    }
  }

  createEventHandlers() {
    this.player.on('initialization_error', e => { console.error(e); });
    this.player.on('authentication_error', e => {
      console.error(e);
      this.setState({ loggedIn: false });
    });
    this.player.on('account_error', e => { console.error(e); });
    this.player.on('playback_error', e => { console.error(e); });

    // Playback status updates
    this.player.on('player_state_changed', state => this.onStateChanged(state));

    // Ready
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
        position,
        duration,
      } = state.track_window;
      const trackName = currentTrack.name;
      const albumName = currentTrack.album.name;
      const albumArt = currentTrack.album.images[0].url;
      const artistName = currentTrack.artists
          .map(artist => artist.name)
          .join(", ");
      const playing = !state.paused;
      this.setState({
        position,
        duration,
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

  // transferPlaybackHere() {
  //   const { deviceId, token } = this.state;
  //   fetch("https://api.spotify.com/v1/me/player", {
  //     method: "PUT",
  //     headers: {
  //       authorization: `Bearer ${token}`,
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       "device_ids": [ deviceId ],
  //       "play": true,
  //     }),
  //   });
  // }

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
      loggedIn,
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

          {loggedIn ? (<div>
            <div className="App-header" id="loggedIn">
              <h2>Now Playing</h2>
              <img src={albumArt} />
            </div>
            <div className="Artist-info">
            <p>Artist: {artistName}</p>
            <p>Track: {trackName}</p>
            <p>Album: {albumName}</p>
            <p>
              <button onClick={() => this.onPrevClick()}>Previous</button>
              <button onClick={() => this.onPlayClick()}>{playing ? "Pause" : "Play"}</button>
              <button onClick={() => this.onNextClick()}>Next</button>
            </p>
          </div></div>) : (<div>
            <div className="App-header">
              <h2>Authentication</h2>
            </div>
            <div className="Token-info">
            <p>
              Enter your Spotify access token.
            </p>
            <p>
              <input type="text" value={token} onChange={e => this.setState({ token: e.target.value })} />
            </p>
            <p>
              <button onClick={() => this.handleLogin()}>GO!</button>
            </p>
          </div></div>)}
        </div>

    );
  }
}

export default App;
