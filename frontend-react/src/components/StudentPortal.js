import React, { useState } from 'react';
import axios from 'axios';
import { verifyFingerprint, getWebAuthnErrorMessage } from './webauthn';

const BACKEND = 'https://cloudbiovote-api.onrender.com';

const CANDIDATES = [
  { id: '1', name: 'Isabel Conklin', photo: 'https://res.cloudinary.com/dl6rcjggo/image/upload/candidate_isabel.jpg' },
  { id: '2', name: 'Conrad Fisher', photo: 'https://res.cloudinary.com/dl6rcjggo/image/upload/candidate_conrad.jpg' },
  { id: '3', name: 'Jeremiah Fisher', photo: 'https://res.cloudinary.com/dl6rcjggo/image/upload/candidate_jeremiah.jpg' },
  { id: '4', name: 'Steven Conklin', photo: 'https://res.cloudinary.com/dl6rcjggo/image/upload/candidate_steven.jpg' },
  { id: '5', name: 'Tylor', photo: 'https://res.cloudinary.com/dl6rcjggo/image/upload/candidate_tylor.jpg' },
];

function isValidUID(uid) {
  const num = parseInt(uid);
  if (isNaN(num)) return false;
  const ranges = [
    [111723043001, 111723043050],
    [111723044001, 111723044050],
    [111723045001, 111723045050],
    [111723046001, 111723046050],
    [111723047001, 111723047050],
  ];
  return ranges.some(([min, max]) => num >= min && num <= max);
}

export default function StudentPortal({ onBack }) {
  const [step, setStep] = useState(1);
  const [uid, setUid] = useState('');
  const [status, setStatus] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState('');
  const [votedFor, setVotedFor] = useState('');

  const startBiometric = async () => {
    if (!uid) { setStatus({ msg: '⚠️ Please enter your Student UID', type: 'error' }); return; }
    if (!isValidUID(uid)) { setStatus({ msg: '❌ Invalid UID. Only registered AMU students can vote.', type: 'error' }); return; }

    setStatus({ msg: '🔐 Place your finger on the scanner...', type: 'success' });
    setScanning(true);

    try {
      // Verify fingerprint linked to this UID
      await verifyFingerprint(uid);
      setStatus({ msg: '✅ Fingerprint matched! Loading your details...', type: 'success' });

      const res = await axios.post(`${BACKEND}/students/verify`, { studentID: uid, biometricID: 'BIO001' });
      setScanning(false);
      setStudentData(res.data);
      setStatus(null);
      setStep(2);

    } catch (err) {
      setScanning(false);
      if (err.response?.status === 403) { setStep(5); return; }
      if (err.response?.status === 404) { setStatus({ msg: '❌ Student not registered in system.', type: 'error' }); return; }
      if (err.response) { setStatus({ msg: '⚠️ Cannot connect to server. Please try again.', type: 'error' }); return; }
      setStatus({ msg: getWebAuthnErrorMessage(err), type: 'error' });
    }
  };

  const castVote = async () => {
    if (!selected) { setStatus({ msg: '⚠️ Please select a candidate', type: 'error' }); return; }
    try {
      const res = await axios.post(`${BACKEND}/votes/cast`, { studentID: studentData.studentID, candidateID: selected });
      setVotedFor(res.data.votedFor);
      setReceipt(res.data.receipt);
      setStep(4);
    } catch (err) {
      if (err.response?.status === 403) { setStep(5); }
      else { setStatus({ msg: '❌ Error casting vote. Try again.', type: 'error' }); }
    }
  };

  // ── Already Voted ──
  if (step === 5) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-logo">
            <div className="uni-seal">🎓</div>
            <div className="header-title"><h1>AMU University</h1><p>Bio-Vote Election System 2024</p></div>
          </div>
          <div className="header-badge"><div className="live-dot"></div>Election Live</div>
        </header>
        <div className="fullpage-center">
          <div className="already-voted-box">
            <div className="already-voted-emoji">🚫</div>
            <h2 className="already-voted-title">Not again dude,</h2>
            <h2 className="already-voted-title accent">Already Voted!</h2>
            <p className="already-voted-sub">You have already cast your vote in the AMU Student Council Election 2024.<br />Each student is allowed only <strong>one vote</strong>.</p>
            <div className="already-voted-badge">✅ Your vote has been recorded</div>
            <button className="portal-btn student-btn" style={{ marginTop: '28px' }} onClick={onBack}>← Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <div className="uni-seal">🎓</div>
          <div className="header-title"><h1>AMU University</h1><p>Bio-Vote Election System 2024</p></div>
        </div>
        <div className="header-badge"><div className="live-dot"></div>Election Live</div>
      </header>

      <div className="main">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-icon student">🎒</div>
            <h2>Student Portal</h2>
            <p>Cast your vote securely</p>
          </div>

          {/* ── STEP 1: Login ── */}
          {step === 1 && (
            <div className="card">
              {status && <div className={`status-msg status-${status.type}`}>{status.msg}</div>}
              <label className="input-label">🪪 Student UID</label>
              <input
                className="input-field"
                type="text"
                placeholder="e.g. 111723043001"
                maxLength={12}
                value={uid}
                onChange={e => { setUid(e.target.value); setStatus(null); }}
              />
              {!scanning ? (
                <>
                  <p style={{ fontSize: '0.78rem', color: '#b06080', marginBottom: '14px', textAlign: 'center' }}>
                    Verify your identity using your registered biometric
                  </p>
                  <button className="bio-btn btn-finger" onClick={startBiometric}>
                    👆 Scan Fingerprint
                  </button>
                  <div className="or-div">or</div>
                  <button className="bio-btn btn-face" onClick={startBiometric}>
                    🔍 Face ID
                  </button>
                </>
              ) : (
                <div className="scanning">
                  <div className="scan-ring">👆</div>
                  <p style={{ color: '#b06080', fontSize: '0.85rem' }}>Scanning... Check your device for the prompt</p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Confirm Details ── */}
          {step === 2 && studentData && (
            <div className="card">
              <div className="student-info">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${studentData.studentID}`} alt="avatar" />
                <h3 style={{ fontFamily: 'Playfair Display,serif', color: '#8b1a4a', fontSize: '1.2rem' }}>{studentData.name}</h3>
                <span className="verified-badge">✅ Biometric Verified</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#8b1a4a', fontWeight: 700, marginBottom: '14px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Please confirm your details
              </p>
              <div className="details-grid">
                <div className="detail-item"><p className="detail-label">Department</p><p className="detail-value">🎓 {studentData.department}</p></div>
                <div className="detail-item"><p className="detail-label">Year</p><p className="detail-value">📅 {studentData.year}</p></div>
                <div className="detail-item"><p className="detail-label">Student UID</p><p className="detail-value">🪪 {studentData.studentID}</p></div>
                <div className="detail-item"><p className="detail-label">Status</p><p className="detail-value" style={{ color: '#2d7a2d' }}>🗳️ Not Voted</p></div>
              </div>
              <div className="detail-item" style={{ marginTop: '10px' }}><p className="detail-label">Email</p><p className="detail-value">📧 {studentData.email || `${studentData.studentID}@amu.edu`}</p></div>
              <div className="detail-item" style={{ marginTop: '10px' }}><p className="detail-label">Election</p><p className="detail-value">🏛️ AMU Student Council 2024</p></div>
              <div className="confirm-actions">
                <button className="btn-confirm-yes" onClick={() => setStep(3)}>✅ Yes, details are correct — Proceed to Vote</button>
                <button className="btn-confirm-no" onClick={() => { setStep(1); setStudentData(null); setUid(''); }}>❌ No, go back</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Vote ── */}
          {step === 3 && studentData && (
            <div className="card">
              <div className="student-info">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${studentData.studentID}`} alt="avatar" />
                <h3 style={{ fontFamily: 'Playfair Display,serif', color: '#8b1a4a' }}>{studentData.name}</h3>
                <span className="verified-badge">✅ Biometric Verified</span>
              </div>
              {status && <div className={`status-msg status-${status.type}`}>{status.msg}</div>}
              <p style={{ fontSize: '0.78rem', color: '#b06080', marginBottom: '14px', fontWeight: 600 }}>SELECT YOUR CANDIDATE</p>
              <div className="candidates-grid">
                {CANDIDATES.slice(0, 4).map(c => (
                  <div key={c.id} className={`candidate-card ${selected === c.id ? 'selected' : ''}`} onClick={() => setSelected(c.id)}>
                    <img src={c.photo} alt={c.name} />
                    <div className="candidate-name">{c.name}</div>
                    <div className="candidate-num">Candidate #{c.id}</div>
                  </div>
                ))}
              </div>
              <div className={`candidate-5 ${selected === '5' ? 'selected' : ''}`} onClick={() => setSelected('5')}>
                <img src={CANDIDATES[4].photo} alt="Tylor" />
                <div><div className="candidate-name">Tylor</div><div className="candidate-num">Candidate #5</div></div>
              </div>
              <button className="btn-vote" onClick={castVote} disabled={!selected}>🗳️ Cast My Vote</button>
            </div>
          )}

          {/* ── STEP 4: Success ── */}
          {step === 4 && (
            <div className="card">
              <div className="confirm-box">
                <div className="confirm-icon">🌸</div>
                <div className="confirm-title">Vote Recorded!</div>
                <div className="confirm-text">
                  Your vote for <strong style={{ color: '#8b1a4a' }}>{votedFor}</strong> has been securely recorded.<br /><br />
                  <strong>You cannot vote again.</strong><br /><br />
                  Thank you for participating in the AMU University Student Council Election 2024! 💕
                </div>
                <div className="receipt-box">
                  <p>🔐 Your vote is encrypted and secured</p>
                  <p style={{ marginTop: '4px' }}>Receipt: #{receipt}</p>
                </div>
                <button className="portal-btn student-btn" style={{ marginTop: '20px' }} onClick={onBack}>← Back to Home</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}