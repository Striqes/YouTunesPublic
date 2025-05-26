// src/App.js
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import AuthPage     from './IndexPage';
import MoodPicker   from './MoodPicker';
import GenrePicker  from './GenrePicker';
import Playlist from './Playlist';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<AuthPage />} />
        <Route path="/mood"    element={<MoodPicker />} />
        <Route path="/genres"  element={<GenrePicker />} />
        <Route path="/playlist"   element={<Playlist />} />
      </Routes>
    </BrowserRouter>
  );
}
