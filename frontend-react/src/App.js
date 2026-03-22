import React from 'react';
import StudentPortal from './components/StudentPortal';
import FacultyPortal from './components/FacultyPortal';
import './App.css';

function App() {
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
      <div className="main">
        <StudentPortal />
        <div className="divider"></div>
        <FacultyPortal />
      </div>
    </div>
  );
}

export default App;