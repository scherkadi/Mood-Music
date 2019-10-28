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
      trackName: "Loading...",
      artistName: "Loading...",
      albumName: "Loading...",
      playing: false,
      albumArt: "",
      mood: "",
    };
    this.playerCheckInterval = null;
    this.handleChange = this.handleChange.bind(this);
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
    const { token, mood } = this.state;
    if (window.Spotify !== null && mood) {
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
    const { deviceId, token, mood} = this.state;
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ "context_uri": mood}),
    });
  }

  handleChange(event) {
    if (event.target.value === "HAPPY :)") {
      this.setState({mood: "spotify:playlist:37i9dQZF1DXdPec7aLTmlC"}); //Happy Hits Playlist
    } else if (event.target.value === "SAD :(") {
      this.setState({mood: "spotify:playlist:37i9dQZF1DX3YSRoSdA634"}); //Life Sucks Playlist
    } else {
      this.setState({mood: "spotify:playlist:37i9dQZF1DX3ND264N08pv"}); //Rage Beats Playlist
    }
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
      mood,
    } = this.state;

    return (
        <div className="App">
          {error && <p>You have an error! : {error}</p> }
          <div className="Web-header">
            Mood Music
          </div>
          {(!mood && token) && (
              <form>
                <div className={"label"}><br/>Pick a mood</div><br/>
                <input type="button" className={"mood"} value={"HAPPY :)"} onClick={this.handleChange}/><br/><br/>
                <input type="button" className={"mood"} value={"SAD :("} onClick={this.handleChange}/><br/><br/>
                <input type="button" className={"mood"} value={"ANGRY X("} onClick={this.handleChange}/>
          </form>)}
          {(mood && token) && (<div>
            <div className="App-header" id="loggedIn">
              <h2>Now Playing</h2>
              <img className="album" alt={"Loading Album Cover..."} src={albumArt} />
            </div>
            <div className="Artist-info">
            <p>Artist: {artistName}</p>
            <p>Track: {trackName}</p>
            <p>Album: {albumName}</p>
            <div>
              <button onClick={() => this.onPrevClick()}>Previous</button>
              <div className={"divider"}/>
              <button onClick={() => this.onPlayClick()}>{playing ? "Pause" : "Play"}</button>
              <div className={"divider"}/>
              <button onClick={() => this.onNextClick()}>Next</button>
            </div>
          </div></div>)}

          {(!token) && (<div>
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
