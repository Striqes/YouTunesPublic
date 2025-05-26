import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function MoodPicker() {
  const navigate = useNavigate();
  const wrapperRef = useRef();
  const emojiRef   = useRef();
  const displayRef = useRef();

  const [currentMood, setCurrentMood] = useState('Neutral');

  // position & size vars
  let halfW, halfH, wrapperW, wrapperH, thresholdX, thresholdY;
  let dragging = useRef(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const emoji   = emojiRef.current;
    const display = displayRef.current;

    const r = wrapper.getBoundingClientRect();
    const e = emoji.getBoundingClientRect();
    halfW     = e.width  / 2;
    halfH     = e.height / 2;
    wrapperW  = r.width;
    wrapperH  = r.height;
    thresholdX = wrapperW  / 3;
    thresholdY = wrapperH  / 3;
    emoji.style.left = `${(wrapperW - e.width) / 2}px`;
    emoji.style.top  = `${(wrapperH - e.height) / 2}px`;
    display.textContent = `Current mood: ${currentMood}`;
    
    // cleanup: none needed
  }, [currentMood]);

  const onMouseDown = () => { dragging.current = true; };
  const onMouseUp   = () => { dragging.current = false; };

  const onMouseMove = e => {
    if (!dragging.current) return;
    const wrapper = wrapperRef.current;
    const emoji   = emojiRef.current;
    const display = displayRef.current;
    const r = wrapper.getBoundingClientRect();

    let cx = e.clientX - r.left;
    let cy = e.clientY - r.top;
    cx = Math.max(halfW, Math.min(r.width  - halfW, cx));
    cy = Math.max(halfH, Math.min(r.height - halfH, cy));

    emoji.style.left = `${cx - halfW}px`;
    emoji.style.top  = `${cy - halfH}px`;

    const valPct = Math.round((cx / wrapperW) * 100);
    const aroPct = Math.round((1 - cy / wrapperH) * 100);

    let mood = 'Neutral', symbol='😐';
    if (cx < thresholdX && cy < thresholdY) {
      mood='Anxious'; symbol='😰';
    } else if (cx > 2*thresholdX && cy < thresholdY) {
      mood='Excited'; symbol='🤩';
    } else if (cx < thresholdX && cy > 2*thresholdY) {
      mood='Depressed'; symbol='😔';
    } else if (cx > 2*thresholdX && cy > 2*thresholdY) {
      mood='Content'; symbol='😊';
    } else if (cy < thresholdY) {
      mood='Energetic'; symbol='😁';
    } else if (cy > 2*thresholdY) {
      mood='Calm'; symbol='😌';
    } else if (cx < thresholdX) {
      mood='Sad'; symbol='😢';
    } else if (cx > 2*thresholdX) {
      mood='Happy'; symbol='😀';
    }

    setCurrentMood(mood);
    emoji.textContent = symbol;
    display.textContent = `Current mood: ${mood}`;
  };

  const handleNext = () => {
    // Store into sessionStorage before navigating
    sessionStorage.setItem('youtunes_mood', JSON.stringify({
      mood:     currentMood,
      // valence/arousal could also be stored similarly
    }));
    window.location.href = '/genres';
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

    <div 
      className="body" 
      onMouseMove={onMouseMove} 
      onMouseUp={onMouseUp}
    >
      <h1>What’s your mood?</h1>
      <div 
        className="mood-wrapper" 
        id="picker" 
        ref={wrapperRef}
      >
        <div className="label-top">Energetic</div>
        <div className="label-bottom">Calm</div>
        <div className="label-left">Sad</div>
        <div className="label-right">Happy</div>

        {/* nine zones (styling only) */}
        {['anxious','energetic','excited','sad','neutral','happy','depressed','calm','content']
          .map(zone => <div key={zone} className={`mood-zone ${zone}`}></div>)
        }

        <div 
          id="emoji" 
          ref={emojiRef} 
          onMouseDown={onMouseDown}
        >
          😐
        </div>
      </div>

      <div id="current-mood" ref={displayRef}>
        Current mood: Neutral
      </div>

      <button 
        id="next" 
        className="btn" 
        onClick={handleNext}
      >
        Next
      </button>
    </div>

    </>
  );
}
