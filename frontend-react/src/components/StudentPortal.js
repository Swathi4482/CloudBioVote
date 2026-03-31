import React, { useState } from 'react';
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

export default function StudentPortal({ onBack }) {
  const [step, setStep] = useState(1);
  const [uid, setUid] = useState('');
  const [status, setStatus] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState('');
  const [votedFor, setVotedFor] = useState('');

  const startBiometric = async (type) => {
    if (!uid) {
      setStatus({ msg: '⚠️ Please enter your Student UID', type: 'error' });
      return;
    }
    if (!isValidUID(uid)) {
      setStatus({ msg: '❌ Invalid UID. Only registered AMU students can vote.', type: 'error' });
      return;
    }

    if (!window.PublicKeyCredential) {
      setStatus({
        msg: '❌ Your device does not support biometric. Please use your smartphone or a device with fingerprint/face sensor.',
        type: 'error'
      });
      return;
    }

    setStatus(null);
    setScanType(type);
    setScanning(true);

    setTimeout(async () => {
      try {
        const enrolled = await isEnrolled(uid);
        if (!enrolled) {
          await enrollFingerprint(uid);
        } else {
          await verifyFingerprint(uid);
        }
        const res = await axios.post(`${BACKEND}/students/verify`, {
          studentID: uid, biometricID: 'BIO001'
        });
        setScanning(false);
        setStudentData(res.data);
        setStatus({ msg: `✅ Welcome, ${res.data.name}!`, type: 'success' });
        setTimeout(() => { setStep(2); setStatus(null); }, 800);
      } catch (err) {
        setScanning(false);
        if (err.response?.status === 403) {
          setStatus({ msg: '🚫 You have already voted!', type: 'warning' });
        } else if (err.response?.status === 404) {
          setStatus({ msg: '❌ Student not registered.', type: 'error' });
        } else {
          setStatus({ msg: getWebAuthnErrorMessage(err), type: 'error' });
        }
      }
    }, 2500);
  };

  const castVote = async () => {
    if (!selected) {
      setStatus({ msg: '⚠️ Please select a candidate', type: 'error' });
      return;
    }
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
          background: 'none', border: 'none', color: '#b06080',
          cursor: 'pointer', fontSize: '0.85rem', marginBottom: '8px'
        }}>← Back</button>
        <div className="panel-icon student">🎒</div>
        <h2>Student Portal</h2>
        <p>Cast your vote securely</p>
      </div>

      {/* STEP 1 — LOGIN */}
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
            onChange={e => setUid(e.target.value)}
          />
          {!scanning ? (
            <>
              <p style={{fontSize:'0.78rem',color:'#b06080',marginBottom:'14px',textAlign:'center'}}>
                Choose your verification method
              </p>
              <button className="bio-btn btn-finger" onClick={() => startBiometric('fingerprint')}>
                👆 Fingerprint / Touch ID
                <span style={{fontSize:'0.72rem',opacity:0.8,display:'block',marginTop:'2px'}}>
                  Android • iPhone • Mac • Laptop scanner
                </span>
              </button>
              <div className="or-div">or</div>
              <button className="bio-btn btn-face" onClick={() => startBiometric('faceid')}>
                🔍 Face ID / Face Unlock
                <span style={{fontSize:'0.72rem',opacity:0.8,display:'block',marginTop:'2px'}}>
                  iPhone • Android • Windows Hello • Mac
                </span>
              </button>
            </>
          ) : (
            <div className="scanning">
              <div className="scan-ring">
                {scanType === 'fingerprint' ? '👆' : '🔍'}
              </div>
              <p style={{color:'#b06080',fontSize:'0.85rem'}}>
                {scanType === 'fingerprint'
                  ? 'Scanning fingerprint... Please hold still'
                  : 'Scanning face... Look at camera'}
              </p>
            </div>
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
          <h2 style={{fontFamily:'Playfair Display,serif',color:'#cc0047',marginBottom:'8px'}}>
            Not Again Dude!
          </h2>
          <p style={{color:'#b06080',fontSize:'1rem',fontWeight:600}}>
            Already Voted!
          </p>
          <p style={{color:'#b06080',fontSize:'0.85rem',marginTop:'12px'}}>
            You have already cast your vote.<br/>
            Each student can only vote once.
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
