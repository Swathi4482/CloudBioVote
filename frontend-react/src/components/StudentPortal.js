/* eslint-disable */
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { enrollFingerprint, verifyFingerprint, isEnrolled, getWebAuthnErrorMessage } from './webauthn';

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

// ── Camera Face ID Component ──────────────────────────────────────────────────
function CameraFaceID({ onVerified, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null); // use ref instead of state for stream
  const [status, setStatus] = useState('requesting');
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });

        if (!mounted) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = mediaStream;

        // Wait for video element to be in DOM
        setTimeout(() => {
          if (videoRef.current && mounted) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch(() => {});
          }
        }, 100);

        setStatus('ready');
      } catch (err) {
        if (!mounted) return;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setStatus('denied');
        } else {
          setStatus('error');
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleVerify = () => {
    setStatus('scanning');
    setCountdown(3);
    let count = 3;
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timer);
        setStatus('verified');
        setTimeout(() => {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
          }
          onVerified();
        }, 1000);
      }
    }, 1000);
  };

  const handleCancel = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    onCancel();
  };

  return (
    <div style={{ textAlign: 'center' }}>

      {/* Requesting */}
      {status === 'requesting' && (
        <div style={{ padding: '30px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📷</div>
          <p style={{ color: '#b06080', fontSize: '0.9rem' }}>Starting camera...</p>
          <p style={{ color: '#c0a0b0', fontSize: '0.78rem', marginTop: '6px' }}>Please allow camera access if prompted</p>
        </div>
      )}

      {/* Denied */}
      {status === 'denied' && (
        <div style={{ padding: '24px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>❌</div>
          <p style={{ color: '#cc2222', fontSize: '0.9rem', fontWeight: 600 }}>Camera access denied!</p>
          <p style={{ color: '#b06080', fontSize: '0.78rem', marginTop: '8px', lineHeight: 1.5 }}>
            Click the 🔒 lock icon in the address bar<br />and allow camera access, then try again.
          </p>
          <button onClick={handleCancel} style={{
            marginTop: '16px', padding: '10px 20px', borderRadius: '10px',
            border: '2px solid rgba(255,107,157,0.3)', background: 'transparent',
            color: '#b06080', cursor: 'pointer', fontWeight: 600
          }}>← Go Back</button>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div style={{ padding: '24px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
          <p style={{ color: '#cc2222', fontSize: '0.9rem', fontWeight: 600 }}>Camera not available!</p>
          <p style={{ color: '#b06080', fontSize: '0.78rem', marginTop: '8px' }}>
            Please check your camera is connected and try again.
          </p>
          <button onClick={handleCancel} style={{
            marginTop: '16px', padding: '10px 20px', borderRadius: '10px',
            border: '2px solid rgba(255,107,157,0.3)', background: 'transparent',
            color: '#b06080', cursor: 'pointer', fontWeight: 600
          }}>← Go Back</button>
        </div>
      )}

      {/* Camera ready / scanning / verified */}
      {(status === 'ready' || status === 'scanning' || status === 'verified') && (
        <div>
          <p style={{ fontSize: '0.82rem', color: '#8b1a4a', fontWeight: 600, marginBottom: '12px' }}>
            {status === 'ready' && '📷 Position your face in the oval'}
            {status === 'scanning' && `🔍 Scanning in ${countdown}...`}
            {status === 'verified' && '✅ Face verified!'}
          </p>

          {/* Camera box */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '300px',
            height: '220px',
            margin: '0 auto 16px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: `3px solid ${status === 'verified' ? '#2d7a2d' : status === 'scanning' ? '#ff6b9d' : 'rgba(255,107,157,0.4)'}`,
            boxShadow: status === 'scanning' ? '0 0 24px rgba(255,107,157,0.5)' : 'none',
            background: '#111',
            transition: 'all 0.3s ease'
          }}>
            {/* Live video feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transform: 'scaleX(-1)' // mirror effect
              }}
            />

            {/* Face oval overlay */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '130px', height: '160px',
              border: `3px solid ${status === 'verified' ? '#2d7a2d' : '#ff6b9d'}`,
              borderRadius: '50%',
              pointerEvents: 'none',
              opacity: status === 'scanning' ? 1 : 0.7,
              transition: 'all 0.3s ease'
            }} />

            {/* Scanning line animation */}
            {status === 'scanning' && (
              <div style={{
                position: 'absolute',
                left: 0, right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #ff6b9d, transparent)',
                animation: 'scanMove 1s linear infinite',
                top: '50%'
              }} />
            )}

            {/* Verified green overlay */}
            {status === 'verified' && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(45,122,45,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3.5rem'
              }}>✅</div>
            )}

            {/* Countdown badge */}
            {status === 'scanning' && countdown > 0 && (
              <div style={{
                position: 'absolute',
                bottom: '10px', left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255,107,157,0.9)',
                color: 'white', fontWeight: 700,
                fontSize: '0.85rem', padding: '4px 14px',
                borderRadius: '50px'
              }}>Hold still... {countdown}</div>
            )}
          </div>

          {/* CSS animation for scan line */}
          <style>{`
            @keyframes scanMove {
              0% { top: 20%; }
              50% { top: 80%; }
              100% { top: 20%; }
            }
          `}</style>

          {status === 'ready' && (
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={handleVerify} style={{
                padding: '14px 28px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg,#ff6b9d,#cc0047)',
                color: 'white', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer'
              }}>
                🔍 Verify Face
              </button>
              <button onClick={handleCancel} style={{
                padding: '14px 20px', borderRadius: '12px',
                border: '2px solid rgba(255,107,157,0.3)', background: 'transparent',
                color: '#b06080', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer'
              }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main StudentPortal ────────────────────────────────────────────────────────
export default function StudentPortal({ onBack }) {
  const [step, setStep] = useState(1);
  const [uid, setUid] = useState('');
  const [status, setStatus] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState('');
  const [votedFor, setVotedFor] = useState('');

  const validateUID = () => {
    if (!uid) { setStatus({ msg: '⚠️ Please enter your Student UID', type: 'error' }); return false; }
    if (!isValidUID(uid)) { setStatus({ msg: '❌ Invalid UID. Only registered AMU students can vote.', type: 'error' }); return false; }
    return true;
  };

  // Fingerprint flow
  const startFingerprint = async () => {
    if (!validateUID()) return;
    if (!window.PublicKeyCredential) {
      setStatus({ msg: '❌ Biometric not supported. Use Chrome on a device with fingerprint sensor.', type: 'error' });
      return;
    }
    setStatus(null);
    setScanning(true);
    try {
      const enrolled = await isEnrolled(uid);
      if (!enrolled) { await enrollFingerprint(uid); } else { await verifyFingerprint(uid); }
      await verifyWithBackend();
    } catch (err) {
      setScanning(false);
      setStatus({ msg: getWebAuthnErrorMessage(err), type: 'error' });
    }
  };

  // Face ID flow — opens camera
  const startFaceID = () => {
    if (!validateUID()) return;
    setStatus(null);
    setShowCamera(true);
  };

  // Called after both fingerprint and face ID verify successfully
  const verifyWithBackend = async () => {
    try {
      const res = await axios.post(`${BACKEND}/students/verify`, { studentID: uid, biometricID: 'BIO001' });
      setScanning(false);
      setShowCamera(false);
      setStudentData(res.data);
      setStep(2);
    } catch (err) {
      setScanning(false);
      setShowCamera(false);
      if (err.response?.status === 403) { setStep(5); }
      else if (err.response?.status === 404) { setStatus({ msg: '❌ Student not registered.', type: 'error' }); }
      else { setStatus({ msg: '⚠️ Cannot connect to server. Please try again.', type: 'error' }); }
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

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <button className="back-btn" onClick={onBack}>← Back</button>
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

      <div className="main">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-icon student">🎒</div>
            <h2>Student Portal</h2>
            <p>Cast your vote securely</p>
          </div>

          {/* STEP 1 — LOGIN */}
          {step === 1 && (
            <div className="card">
              {status && <div className={`status-msg status-${status.type}`}>{status.msg}</div>}

              {!showCamera ? (
                <>
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
                        Choose your verification method
                      </p>
                      <button className="bio-btn btn-finger" onClick={startFingerprint}>
                        👆 Fingerprint / Touch ID
                        <span style={{ fontSize: '0.72rem', opacity: 0.8, display: 'block', marginTop: '2px' }}>
                          Android • iPhone • Mac • Laptop scanner
                        </span>
                      </button>
                      <div className="or-div">or</div>
                      <button className="bio-btn btn-face" onClick={startFaceID}>
                        🔍 Face ID / Face Unlock
                        <span style={{ fontSize: '0.72rem', opacity: 0.8, display: 'block', marginTop: '2px' }}>
                          Opens camera • Works on all devices
                        </span>
                      </button>
                    </>
                  ) : (
                    <div className="scanning">
                      <div className="scan-ring">👆</div>
                      <p style={{ color: '#b06080', fontSize: '0.85rem' }}>Scanning fingerprint... Please hold still</p>
                    </div>
                  )}
                </>
              ) : (
                <CameraFaceID
                  onVerified={verifyWithBackend}
                  onCancel={() => { setShowCamera(false); setStatus(null); }}
                />
              )}
            </div>
          )}

          {/* STEP 2 — CONFIRM DETAILS */}
          {step === 2 && studentData && (
            <div className="card">
              <div className="student-info">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${studentData.studentID}`} alt="avatar" />
                <h3 style={{ fontFamily: 'Playfair Display,serif', color: '#8b1a4a', fontSize: '1.2rem' }}>{studentData.name}</h3>
                <span style={{ background: 'linear-gradient(135deg,#ff6b9d,#cc0047)', color: 'white', padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 600, marginTop: '6px', display: 'inline-block' }}>
                  ✅ Biometric Verified
                </span>
              </div>
              <div style={{ background: 'rgba(255,107,157,0.05)', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(255,107,157,0.15)' }}>
                <p style={{ fontSize: '0.78rem', color: '#8b1a4a', fontWeight: 600, marginBottom: '12px', textAlign: 'center' }}>Please confirm your details</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'white', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.65rem', color: '#b06080', textTransform: 'uppercase', letterSpacing: '1px' }}>Department</p>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8b1a4a', marginTop: '2px' }}>🎓 {studentData.department}</p>
                  </div>
                  <div style={{ background: 'white', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.65rem', color: '#b06080', textTransform: 'uppercase', letterSpacing: '1px' }}>Year</p>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8b1a4a', marginTop: '2px' }}>📅 {studentData.year}</p>
                  </div>
                  <div style={{ background: 'white', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.65rem', color: '#b06080', textTransform: 'uppercase', letterSpacing: '1px' }}>Student UID</p>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8b1a4a', marginTop: '2px' }}>🪪 {studentData.studentID}</p>
                  </div>
                  <div style={{ background: 'white', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.65rem', color: '#b06080', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</p>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2d7a2d', marginTop: '2px' }}>🗳️ Not Voted</p>
                  </div>
                </div>
                <div style={{ background: 'white', borderRadius: '10px', padding: '10px', textAlign: 'center', marginTop: '10px' }}>
                  <p style={{ fontSize: '0.65rem', color: '#b06080', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</p>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8b1a4a', marginTop: '2px' }}>📧 {studentData.email || `${studentData.studentID}@amu.edu`}</p>
                </div>
              </div>
              <button className="btn-vote" onClick={() => setStep(3)}>✅ Yes, These Are My Details → Proceed to Vote</button>
              <button onClick={() => { setStep(1); setUid(''); }} style={{ width: '100%', padding: '12px', marginTop: '8px', borderRadius: '14px', border: '2px solid rgba(255,107,157,0.3)', background: 'transparent', color: '#b06080', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                ❌ Not My Details → Go Back
              </button>
            </div>
          )}

          {/* STEP 3 — VOTE */}
          {step === 3 && (
            <div className="card">
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: 'Playfair Display,serif', color: '#8b1a4a' }}>Student Council President</h3>
                <p style={{ fontSize: '0.8rem', color: '#ff6b9d', marginTop: '4px' }}>{studentData.name} | {studentData.department}</p>
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

          {/* STEP 4 — SUCCESS */}
          {step === 4 && (
            <div className="card">
              <div className="confirm-box">
                <div className="confirm-icon">🌸</div>
                <div className="confirm-title">Vote Recorded!</div>
                <div className="confirm-text">
                  Your vote for <strong style={{ color: '#8b1a4a' }}>{votedFor}</strong> has been securely recorded.<br /><br />
                  <strong>You cannot vote again.</strong><br /><br />
                  Thank you for participating in the AMU University Student Council Election 2026! 💕
                </div>
                <div className="receipt-box">
                  <p>🔐 Your vote is encrypted and secured</p>
                  <p style={{ marginTop: '4px' }}>Receipt: #{receipt}</p>
                </div>
                <button className="back-btn" style={{ marginTop: '20px' }} onClick={onBack}>← Back to Home</button>
              </div>
            </div>
          )}

          {/* STEP 5 — ALREADY VOTED */}
          {step === 5 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🚫</div>
              <h2 style={{ fontFamily: 'Playfair Display,serif', color: '#cc0047', marginBottom: '8px', fontSize: '2rem' }}>Not Again Dude!</h2>
              <p style={{ color: '#cc0047', fontSize: '1.2rem', fontWeight: 700, marginTop: '8px' }}>Already Voted! 🗳️</p>
              <p style={{ color: '#b06080', fontSize: '0.85rem', marginTop: '12px', lineHeight: 1.6 }}>
                You have already cast your vote.<br />Each student can only vote once.<br />Your vote has been recorded securely.
              </p>
              <button onClick={onBack} style={{ marginTop: '20px', padding: '12px 24px', borderRadius: '12px', border: '2px solid rgba(255,107,157,0.3)', background: 'transparent', color: '#b06080', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                ← Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
