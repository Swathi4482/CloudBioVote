import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StudentPortal from './components/StudentPortal';
import FacultyPortal from './components/FacultyPortal';
import Enroll from './components/Enroll';
import EnrollFaculty from './components/EnrollFaculty';
import './App.css';

function Home() {
  const [portal, setPortal] = React.useState(null);

  if (portal === 'student') return (
    <div className="single-portal">
      <StudentPortal onBack={() => setPortal(null)} />
    </div>
  );

  if (portal === 'faculty') return (
    <div className="single-portal">
      <FacultyPortal onBack={() => setPortal(null)} />
    </div>
  );

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <div className="uni-seal">🎓</div>
          <div className="header-title">
            <h1>AMU University</h1>
            <p>Bio-Vote Election System 2026</p>
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
          <p className="landing-sub">Secure biometric voting for AMU Student Council Election 2026</p>
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/enroll" element={<Enroll />} />
        <Route path="/enroll-faculty" element={<EnrollFaculty />} />
      </Routes>
    </BrowserRouter>
  );
}
