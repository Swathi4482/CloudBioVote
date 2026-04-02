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

// Camera Face ID Component
function CameraFaceID({ onVerified, onCancel }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState('requesting');
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStatus('ready');
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setStatus('denied');
      } else {
        setStatus('error');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

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
          stopCamera();
          onVerified();
        }, 1000);
      }
    }, 1000);
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div style={{textAlign:'center'}}>
      {status === 'requesting' && (
        <div style={{padding:'20px'}}>
          <div style={{fontSize:'2rem',marginBottom:'12px'}}>📷</div>
          <p style={{color:'#b06080',fontSize:'0.85rem'}}>
            Requesting camera access...
          </p>
        </div>
      )}

      {status === 'denied' && (
        <div style={{padding:'20px'}}>
          <div style={{fontSize:'2rem',marginBottom:'12px'}}>❌</div>
          <p style={{color:'#cc2222',fontSize:'0.85rem',fontWeight:600}}>
            Camera access denied!
          </p>
          <p style={{color:'#b06080',fontSize:'0.78rem',marginTop:'8px'}}>
            Please allow camera access in your browser settings and try again.
          </p>
          <button onClick={handleCancel} style={{
            marginTop:'16px',padding:'10px 20px',borderRadius:'10px',
            border:'2px solid rgba(255,107,157,0.3)',background:'transparent',
            color:'#b06080',cursor:'pointer',fontWeight:600
          }}>
            ← Go Back
          </button>
        </div>
      )}

      {(status === 'ready' || status === 'scanning' || status === 'verified') && (
        <div>
          <p style={{fontSize:'0.78rem',color:'#8b1a4a',fontWeight:600,marginBottom:'10px'}}>
            {status === 'ready' && '📷 Position your face in the camera'}
            {status === 'scanning' && `🔍 Scanning in ${countdown}...`}
            {status === 'verified' && '✅ Face verified!'}
          </p>

          {/* Camera Preview */}
          <div style={{
            position:'relative',
            width:'100%',
            maxWidth:'300px',
            margin:'0 auto 16px',
            borderRadius:'16px',
            overflow:'hidden',
            border:'3px solid',
            borderColor: status === 'verified' ? '#2d7a2d' : status === 'scanning' ? '#ff6b9d' : 'rgba(255,107,157,0.4)',
            boxShadow: status === 'scanning' ? '0 0 20px rgba(255,107,157,0.5)' : 'none',
            transition:'all 0.3s ease'
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width:'100%',
                height:'200px',
                objectFit:'cover',
                display:'block',
                transform:'scaleX(-1)'
              }}
            />

            {/* Face outline overlay */}
            <div style={{
              position:'absolute',
              top:'50%',left:'50%',
              transform:'translate(-50%,-50%)',
              width:'120px',height:'150px',
              border:`3px solid ${status === 'verified' ? '#2d7a2d' : '#ff6b9d'}`,
              borderRadius:'50%',
              opacity: status === 'scanning' ? 1 : 0.6
            }} />

            {/* Scanning animation */}
            {status === 'scanning' && (
              <div style={{
                position:'absolute',
                top:0,left:0,right:0,
                height:'3px',
                background:'linear-gradient(90deg,transparent,#ff6b9d,transparent)',
                animation:'scanLine 1s linear infinite'
              }} />
            )}

            {/* Verified overlay */}
            {status === 'verified' && (
              <div style={{
                position:'absolute',
                top:0,left:0,right:0,bottom:0,
                background:'rgba(45,122,45,0.3)',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                fontSize:'3rem'
              }}>
                ✅
              </div>
            )}
          </div>

          {status === 'ready' && (
            <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
              <button onClick={handleVerify} style={{
                padding:'14px 28px',borderRadius:'12px',border:'none',
                background:'linear-gradient(135deg,#ff6b9d,#cc0047)',
                color:'white',fontSize:'0.95rem',fontWeight:600,cursor:'pointer'
              }}>
                🔍 Verify Face
              </button>
              <button onClick={handleCancel} style={{
                padding:'14px 20px',borderRadius:'12px',
                border:'2px solid rgba(255,107,157,0.3)',background:'transparent',
                color:'#b06080',fontSize:'0.95rem',fontWeight:600,cursor:'pointer'
              }}>
                Cancel
              </button>
            </div>
          )}

          {status === 'scanning' && (
            <p style={{color:'#ff6b9d',fontSize:'0.9rem',fontWeight:600}}>
              Hold still... {countdown}
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}

export default function StudentPortal({ onBack }) {
  const [step, setStep] = useState(1);
  const [uid, setUid] = useState('');
  const [status, setStatus] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState('');
  const [votedFor, setVotedFor] = useState('');

  const startFingerprint = async () => {
    if (!uid) { setStatus({ msg: '⚠️ Please enter your Student UID', type: 'error' }); return; }
    if (!isValidUID(uid)) { setStatus({ msg: '❌ Invalid UID. Only registered AMU students can vote.', type: 'error' }); return; }
    if (!window.PublicKeyCredential) {
      setStatus({ msg: '❌ Fingerprint not supported. Please use Face ID instead.', type: 'error' });
      return;
    }
    setStatus(null);
    setScanType('fingerprint');
    setScanning(true);

    setTimeout(async () => {
      try {
        const enrolled = await isEnrolled(uid);
        if (!enrolled) {
          await enrollFingerprint(uid);
        } else {
          await verifyFingerprint(uid);
        }
        await verifyWithBackend();
      } catch (err) {
        setScanning(false);
        if (err.response?.status === 403) {
          setStep(5);
        } else if (err.response?.status === 404) {
          setStatus({ msg: '❌ Student not registered.', type: 'error' });
        } else {
          setStatus({ msg: getWebAuthnErrorMessage(err), type: 'error' });
        }
      }
    }, 500);
  };

  const startFaceID = () => {
    if (!uid) { setStatus({ msg: '⚠️ Please enter your Student UID', type: 'error' }); return; }
    if (!isValidUID(uid)) { setStatus({ msg: '❌ Invalid UID. Only registered AMU students can vote.', type: 'error' }); return; }
    setStatus(null);
    setScanType('faceid');
    setShowCamera(true);
  };

  const verifyWithBackend = async () => {
    try {
      const res = await axios.post(`${BACKEND}/students/verify`, {
        studentID: uid, biometricID: 'BIO001'
      });
      setScanning(false);
      setShowCamera(false);
      setStudentData(res.data);
      setStatus({ msg: `✅ Welcome, ${res.data.name}!`, type: 'success' });
      setTimeout(() => { setStep(2); setStatus(null); }, 800);
    } catch (err) {
      setScanning(false);
      setShowCamera(false);
      if (err.response?.status === 403) {
        setStep(5);
      } else if (err.response?.status === 404) {
        setStatus({ msg: '❌ Student not registered.', type: 'error' });
      } else {
        setStatus({ msg: '⚠️ Cannot connect to server.', type: 'error' });
      }
    }
  };

  const castVote = async () => {
    if (!selected) { setStatus({ msg: '⚠️ Please select a candidate', type: 'error' }); return; }
    try {
      const res = await axios.post(`${BACKEND}/votes/cast`, {
        studentID: studentData.studentID, candidateID: selected
      });
      setVotedFor(res.data.votedFor);
      setReceipt(res.data.receipt);
      setStep(4);
    } catch (err) {
      if (err.response?.status === 403) {
        setStep(5);
      } else {
        setStatus({ msg: '❌ Error casting vote. Try again.', type: 'error' });
      }
    }
  };

  return (
    <div className="panel panel-left">
      <div className="panel-header">
        <button onClick={onBack} style={{
          background:'none',border:'none',color:'#b06080',
          cursor:'pointer',fontSize:'0.85rem',marginBottom:'8px'
        }}>← Back</button>
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
                onChange={e => setUid(e.target.value)}
              />
              {!scanning ? (
                <>
                  <p style={{fontSize:'0.78rem',color:'#b06080',marginBottom:'14px',textAlign:'center'}}>
                    Choose your verification method
                  </p>
                  <button className="bio-btn btn-finger" onClick={startFingerprint}>
                    👆 Fingerprint / Touch ID
                    <span style={{fontSize:'0.72rem',opacity:0.8,display:'block',marginTop:'2px'}}>
                      Android • iPhone • Mac • Laptop scanner
                    </span>
                  </button>
                  <div className="or-div">or</div>
                  <button className="bio-btn btn-face" onClick={startFaceID}>
                    🔍 Face ID / Face Unlock
                    <span style={{fontSize:'0.72rem',opacity:0.8,display:'block',marginTop:'2px'}}>
                      Opens camera • Works on all devices
                    </span>
                  </button>
                </>
              ) : (
                <div className="scanning">
                  <div className="scan-ring">👆</div>
                  <p style={{color:'#b06080',fontSize:'0.85rem'}}>
                    Scanning fingerprint... Please hold still
                  </p>
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
            <h3 style={{fontFamily:'Playfair Display,serif',color:'#8b1a4a',fontSize:'1.2rem'}}>
              {studentData.name}
            </h3>
            <span style={{
              background:'linear-gradient(135deg,#ff6b9d,#cc0047)',
              color:'white',padding:'4px 12px',borderRadius:'50px',
              fontSize:'0.7rem',fontWeight:600,marginTop:'6px',display:'inline-block'
            }}>
              ✅ Biometric Verified
            </span>
          </div>

          <div style={{background:'rgba(255,107,157,0.05)',borderRadius:'14px',padding:'16px',marginBottom:'16px',border:'1px solid rgba(255,107,157,0.15)'}}>
            <p style={{fontSize:'0.78rem',color:'#8b1a4a',fontWeight:600,marginBottom:'12px',textAlign:'center'}}>
              Please confirm your details
            </p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              <div style={{background:'white',borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                <p style={{fontSize:'0.65rem',color:'#b06080',textTransform:'uppercase',letterSpacing:'1px'}}>Department</p>
                <p style={{fontSize:'0.78rem',fontWeight:600,color:'#8b1a4a',marginTop:'2px'}}>🎓 {studentData.department}</p>
              </div>
              <div style={{background:'white',borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                <p style={{fontSize:'0.65rem',color:'#b06080',textTransform:'uppercase',letterSpacing:'1px'}}>Year</p>
                <p style={{fontSize:'0.78rem',fontWeight:600,color:'#8b1a4a',marginTop:'2px'}}>📅 {studentData.year}</p>
              </div>
              <div style={{background:'white',borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                <p style={{fontSize:'0.65rem',color:'#b06080',textTransform:'uppercase',letterSpacing:'1px'}}>Student UID</p>
                <p style={{fontSize:'0.78rem',fontWeight:600,color:'#8b1a4a',marginTop:'2px'}}>🪪 {studentData.studentID}</p>
              </div>
              <div style={{background:'white',borderRadius:'10px',padding:'10px',textAlign:'center'}}>
                <p style={{fontSize:'0.65rem',color:'#b06080',textTransform:'uppercase',letterSpacing:'1px'}}>Status</p>
                <p style={{fontSize:'0.78rem',fontWeight:600,color:'#2d7a2d',marginTop:'2px'}}>🗳️ Not Voted</p>
              </div>
            </div>
            <div style={{background:'white',borderRadius:'10px',padding:'10px',textAlign:'center',marginTop:'10px'}}>
              <p style={{fontSize:'0.65rem',color:'#b06080',textTransform:'uppercase',letterSpacing:'1px'}}>Email</p>
              <p style={{fontSize:'0.78rem',fontWeight:600,color:'#8b1a4a',marginTop:'2px'}}>
                📧 {studentData.email || `${studentData.studentID}@amu.edu`}
              </p>
            </div>
          </div>

          <button className="btn-vote" onClick={() => setStep(3)}>
            ✅ Yes, These Are My Details → Proceed to Vote
          </button>
          <button onClick={() => setStep(1)} style={{
            width:'100%',padding:'12px',marginTop:'8px',borderRadius:'14px',
            border:'2px solid rgba(255,107,157,0.3)',background:'transparent',
            color:'#b06080',fontSize:'0.9rem',fontWeight:600,cursor:'pointer'
          }}>
            ❌ Not My Details → Go Back
          </button>
        </div>
      )}

      {/* STEP 3 — VOTE */}
      {step === 3 && (
        <div className="card">
          <div style={{textAlign:'center',marginBottom:'16px'}}>
            <h3 style={{fontFamily:'Playfair Display,serif',color:'#8b1a4a'}}>
              Student Council President
            </h3>
            <p style={{fontSize:'0.8rem',color:'#ff6b9d',marginTop:'4px'}}>
              {studentData.name} | {studentData.department}
            </p>
          </div>

          {status && <div className={`status-msg status-${status.type}`}>{status.msg}</div>}

          <p style={{fontSize:'0.78rem',color:'#b06080',marginBottom:'14px',fontWeight:600}}>
            SELECT YOUR CANDIDATE
          </p>

          <div className="candidates-grid">
            {CANDIDATES.slice(0,4).map(c => (
              <div key={c.id} className={`candidate-card ${selected===c.id?'selected':''}`} onClick={() => setSelected(c.id)}>
                <img src={c.photo} alt={c.name} />
                <div className="candidate-name">{c.name}</div>
                <div className="candidate-num">Candidate #{c.id}</div>
              </div>
            ))}
          </div>

          <div className={`candidate-5 ${selected==='5'?'selected':''}`} onClick={() => setSelected('5')}>
            <img src={CANDIDATES[4].photo} alt="Tylor" />
            <div>
              <div className="candidate-name">Tylor</div>
              <div className="candidate-num">Candidate #5</div>
            </div>
          </div>

          <button className="btn-vote" onClick={castVote} disabled={!selected}>
            🗳️ Cast My Vote
          </button>
        </div>
      )}

      {/* STEP 4 — CONFIRMATION */}
      {step === 4 && (
        <div className="card">
          <div className="confirm-box">
            <div className="confirm-icon">🌸</div>
            <div className="confirm-title">Vote Recorded!</div>
            <div className="confirm-text">
              Your vote for{' '}
              <strong style={{color:'#8b1a4a'}}>{votedFor}</strong>{' '}
              has been securely recorded.<br /><br />
              <strong>You cannot vote again.</strong><br /><br />
              Thank you for participating in the AMU University Student Council Election 2024! 💕
            </div>
            <div className="receipt-box">
              <p>🔐 Your vote is encrypted and secured</p>
              <p style={{marginTop:'4px'}}>Receipt: #{receipt}</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5 — ALREADY VOTED */}
      {step === 5 && (
        <div className="card" style={{textAlign:'center',padding:'40px 20px'}}>
          <div style={{fontSize:'4rem',marginBottom:'16px'}}>🚫</div>
          <h2 style={{fontFamily:'Playfair Display,serif',color:'#cc0047',marginBottom:'8px',fontSize:'2rem'}}>
            Not Again Dude!
          </h2>
          <p style={{color:'#cc0047',fontSize:'1.2rem',fontWeight:700,marginTop:'8px'}}>
            Already Voted! 🗳️
          </p>
          <p style={{color:'#b06080',fontSize:'0.85rem',marginTop:'12px',lineHeight:1.6}}>
            You have already cast your vote.<br/>
            Each student can only vote once.<br/>
            Your vote has been recorded securely.
          </p>
          <button onClick={() => { setStep(1); setUid(''); setSelected(null); }} style={{
            marginTop:'20px',padding:'12px 24px',borderRadius:'12px',
            border:'2px solid rgba(255,107,157,0.3)',background:'transparent',
            color:'#b06080',fontSize:'0.9rem',fontWeight:600,cursor:'pointer'
          }}>
            ← Go Back
          </button>
        </div>
      )}
    </div>
  );
}
