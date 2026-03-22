import React, { useState } from 'react';
import StudentPortal from './components/StudentPortal';
import FacultyPortal from './components/FacultyPortal';
import './App.css';

function App() {
  const [portal, setPortal] = useState(null); // null | 'student' | 'faculty'

  if (portal === 'student') {
    return <StudentPortal onBack={() => setPortal(null)} />;
  }

  if (portal === 'faculty') {
    return <FacultyPortal onBack={() => setPortal(null)} />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <div className="uni-seal">🎓</div>
          <div className="header-title">
            <h1>AMU University</h1>
            <p>Bio-Vote Election System 2024</p>
          </div>
        </div>
        <div className="header-badge">
          <div className="live-dot"></div>
          Election Live
        </div>
      </header>

      <div className="landing">
        <div className="landing-hero">
          <div className="landing-icon">🗳️</div>
          <h2 className="landing-title">Welcome to Cloud Bio-Vote</h2>
          <p className="landing-sub">Secure biometric voting for AMU Student Council Election 2024</p>
        </div>

        <div className="portal-cards">
          <div className="portal-card student-card" onClick={() => setPortal('student')}>
            <div className="portal-card-icon">🎒</div>
            <h3>Student Portal</h3>
            <p>Cast your vote securely using biometric verification</p>
            <button className="portal-btn student-btn">Enter as Student →</button>
          </div>

          <div className="portal-card faculty-card" onClick={() => setPortal('faculty')}>
            <div className="portal-card-icon">👩‍🏫</div>
            <h3>Faculty Portal</h3>
            <p>Monitor live election results and vote counts</p>
            <button className="portal-btn faculty-btn">Enter as Faculty →</button>
          </div>
        </div>

        <p className="landing-footer">🔒 All votes are encrypted and stored securely in Firebase</p>
      </div>
    </div>
  );
}

export default App;