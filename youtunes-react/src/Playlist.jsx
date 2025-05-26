// src/Playlist.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './playlist.css';

const LASTFM_API_KEY = '86cabc88d426d9eb793a9ed6588ca7d3';

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export default function Playlist() {
  const navigate = useNavigate();

  // Pull once from sessionStorage
  const genres   = JSON.parse(sessionStorage.getItem('youtunes_genres') || '[]');
  const genreList= genres.join(', ');  // all picked genres
  const genre    = genres[0] || '';
  const moodData = JSON.parse(sessionStorage.getItem('youtunes_mood')   || '{}');
  const count    = parseInt(sessionStorage.getItem('youtunes_count'), 10) || 10;
  const token    = sessionStorage.getItem('spotify_access_token') || '';

  // Controlled state
  const defaultName = `${genreList} + ${moodData.mood} Recommendations`;
  const [playlistName, setPlaylistName] = useState(defaultName);

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [embeds,  setEmbeds]  = useState([]);
  const [uris,    setUris]    = useState([]);

  // Fetch & assemble tracks
  const loadTracks = useCallback(async () => {
    setLoading(true);
    setError('');
    setEmbeds([]);
    setUris([]);

    if (!token) {
      alert('⚠️ Spotify session not found. Please connect your account first.');
      return navigate('/', { replace: true });
    }

    try {
      // 1) Last.fm calls
      const [gRes, mRes] = await Promise.all([
        fetch(`https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${encodeURIComponent(genre.toLowerCase())}&api_key=${LASTFM_API_KEY}&format=json&limit=100`),
        fetch(`https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${encodeURIComponent(moodData.mood.toLowerCase())}&api_key=${LASTFM_API_KEY}&format=json&limit=100`)
      ]);
      const genreTracksAll = (await gRes.json()).tracks.track;
      const moodTracksAll  = (await mRes.json()).tracks.track;

      let foundUris   = [];
      let foundEmbeds = [];

      // retry loop until we have exactly `count` matches
      while (foundEmbeds.length < count) {
        const gShuf = [...genreTracksAll];
        const mShuf = [...moodTracksAll];
        shuffle(gShuf);
        shuffle(mShuf);

        const key = t => `${t.name}|${t.artist.name}`;
        const setG = new Set(gShuf.map(key));
        let both   = mShuf.filter(t => setG.has(key(t)));

        if (both.length < count) {
          const merged = Array.from(
            new Map(
              [...mShuf, ...gShuf].map(t => [key(t), t])
            ).values()
          );
          shuffle(merged);
          both = merged.slice(0, count);
        } else {
          both = both.slice(0, count);
        }

        // Spotify search for each candidate
        foundUris = [];
        foundEmbeds = [];
        for (let t of both) {
          const q = encodeURIComponent(`track:${t.name} artist:${t.artist.name}`);
          const res = await fetch(`https://api.spotify.com/v1/search?type=track&limit=1&q=${q}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const items = (await res.json()).tracks?.items;
          if (items && items[0]) {
            const uri = items[0].uri;
            foundUris.push(uri);
            foundEmbeds.push(`https://open.spotify.com/embed/track/${uri.split(':').pop()}`);
          }
        }
      }

      setUris(foundUris);
      setEmbeds(foundEmbeds);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to fetch tracks.');
    } finally {
      setLoading(false);
    }
  }, [genre, moodData.mood, count, token, navigate]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  // Build playlist on Spotify
  const buildPlaylist = async () => {
    try {
      const me = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());

      const pl = await fetch(`https://api.spotify.com/v1/users/${me.id}/playlists`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name:        playlistName,
          description: `Random ${count} tracks from ${genreList} + ${moodData.mood}`,
          public: false
        })
      }).then(r => r.json());

      await fetch(`https://api.spotify.com/v1/playlists/${pl.id}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris })
      });

      window.open(`https://open.spotify.com/playlist/${pl.id}`, '_blank');
    } catch (e) {
      console.error(e);
      alert('Error creating Spotify playlist. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/genres', { replace: true });
  };

  if (loading) return <p>Loading tracks…</p>;
  if (error)   return <p style={{ color: '#f88', textAlign: 'center' }}>{error}</p>;

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  const handleIndex = () => {
    navigate('/');
  }

  return (
    <>

    <nav className="navbar">
        <div className="nav-left">
          <img
            className="logo"
            src="/logo.png"
            alt="Logo"
            onClick={handleIndex}
            style={{ cursor: 'pointer' }}
          />
          <a href="/mood">Home</a>
        </div>
        <button onClick={handleLogout}>Logout</button>
    </nav>

    <div className="main-content">
      <h1 style={{ textAlign:'center', margin:'2rem 0' }}>
        {genreList} + {moodData.mood} Recommendations
      </h1>

      {/* Playlist name editor */}
      <div style={{ textAlign:'center', margin: '1rem 0' }}>
        <label htmlFor="playlist-name" style={{ marginRight: '0.5rem' }}>
          Playlist Name:
        </label>
        <input
          id="playlist-name"
          type="text"
          value={playlistName}
          onChange={e => setPlaylistName(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            width: '60%',
            maxWidth: '400px'
          }}
        />
      </div>

      <div className="grid">
        {embeds.map((src, i) => (
          <div key={i} className="track">
            <iframe src={src} allow="encrypted-media" title={`track-${i}`} />
          </div>
        ))}
      </div>

      <div className="controls">
        <button className="btn" onClick={handleBack}>
          Back
        </button>
        <button className="btn" onClick={loadTracks}>
          Shuffle
        </button>
        <button className="btn" disabled={!uris.length} onClick={buildPlaylist}>
          Build Spotify Playlist
        </button>
      </div>
    </div>

    </>
  );
}
