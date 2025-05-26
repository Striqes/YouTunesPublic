// src/IndexPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Only need the authorize endpoint now
const SPOTIFY_AUTHORIZE_ENDPOINT = 'http://127.0.0.1:8000/api/spotify/authorize';

export default function IndexPage() {
  const navigate = useNavigate();
  const [loading, setLoading]         = useState(true);
  const [isAuthenticated, setAuth]    = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const params     = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const userParam  = params.get('user');

    if (tokenParam) {
      sessionStorage.setItem('spotify_access_token', tokenParam);
      if (userParam) sessionStorage.setItem('spotify_user', userParam);

      window.history.replaceState({}, document.title, window.location.pathname);

      setDisplayName(userParam || sessionStorage.getItem('spotify_user'));
      setAuth(true);
    } else {
      const storedToken = sessionStorage.getItem('spotify_access_token');
      const storedUser  = sessionStorage.getItem('spotify_user');
      if (storedToken && storedUser) {
        setDisplayName(storedUser);
        setAuth(true);
      }
    }

    setLoading(false);
  }, [navigate]);

  const handleLogin = () => {
    window.location.href = SPOTIFY_AUTHORIZE_ENDPOINT;
  };

  const handleLogout = () => {
    // clear everything client-side
    localStorage.removeItem('spotify_code_verifier');
    sessionStorage.removeItem('spotify_access_token');
    sessionStorage.removeItem('spotify_user');
    setAuth(false);
    setDisplayName('');
    navigate('/', { replace: true });
  };

  if (loading) {
    return <p style={{ color: '#FFF5F1', textAlign: 'center' }}>Loading...</p>;
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'2rem' }}>
        <h1>YouTunes</h1>
        <p className="subtitle">Discover music that fits your mood</p>
        <button className="btn" onClick={handleLogin}>
          Connect with Spotify
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      padding: '2rem'
    }}>
      <h1>YouTunes</h1>
      <p className="subtitle">Welcome, {displayName}!</p>
      <button className="btn" onClick={() => navigate('/mood')}>
        Continue
      </button>
      <button className="logout" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}
