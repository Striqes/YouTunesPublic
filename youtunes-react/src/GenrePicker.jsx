// src/GenrePicker.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Indie', 'Metal', 'Punk',
  'Classical', 'Alternative', 'Chill', 'Country', 'Techno'
];

export default function GenrePicker() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [count, setCount] = useState('');

  // Redirect back to mood if no mood stored
  useEffect(() => {
    const moodData = JSON.parse(sessionStorage.getItem('youtunes_mood') || 'null');
    if (!moodData) {
      navigate('/mood', { replace: true });
    }
  }, [navigate]);

  // Toggle genre in selection (max 5)
  const toggleGenre = (genre) => {
    setSelected((prev) => {
      if (prev.includes(genre)) {
        return prev.filter(g => g !== genre);
      } else if (prev.length < 5) {
        return [...prev, genre];
      } else {
        alert('You can choose up to 5 genres only.');
        return prev;
      }
    });
  };

  // Validate inputs, store in sessionStorage, and navigate to playlist page
  const handleGenerate = () => {
    if (selected.length === 0) {
      return alert('Please select at least one genre.');
    }
    const n = parseInt(count, 10);
    if (!n || n < 1) {
      return alert('Please enter a valid number of songs.');
    }
    if (n > 25) {
      return alert('Please choose 25 songs or fewer.');
    }

    sessionStorage.setItem('youtunes_genres', JSON.stringify(selected));
    sessionStorage.setItem('youtunes_count', n);
    navigate('/playlist');
  };

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

    <div className="picker-container" style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Choose up to 5 genres:</h1>

      <div
        className="genres"
        style={{
          margin: '2rem 0',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '1rem'
        }}
      >
        {GENRES.map((g) => (
          <div
            key={g}
            className={`genre-btn${selected.includes(g) ? ' selected' : ''}`}
            onClick={() => toggleGenre(g)}
          >
            {g}
          </div>
        ))}
      </div>

      <div>
        <label htmlFor="count">How many songs? (Upto 25 songs)</label>
        <input
          id="count"
          type="number"
          className="count-input"
          min="1"
          max="25"
          placeholder="10"
          value={count}
          onChange={e => setCount(e.target.value)}
          style={{ marginLeft: '0.5rem' }}
        />
      </div>

      <div
        className="controls"
        style={{
          marginTop: '2rem',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}
      >
        <Link to="/mood" className="btn">Back</Link>
        <button
          type="button"
          onClick={handleGenerate}
          className="btn"
        >
          Generate now
        </button>
      </div>
    </div>
    </>
  );
}
