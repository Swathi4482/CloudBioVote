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
  return (num >= 111723043001 && num <= 111723043050) || (num >= 111723043051 && num <= 111723043100);
}

export default function StudentPortal({ onBack }) {
  const [step, setStep] = useState(1);
  const [uid, setUid] = useState('');
  const [status, setStatus] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState(null);
  
  const videoRef = useRef(null);

  // CAMERA LOGIC - Only for Face ID
  useEffect(() => {
    let stream = null;
    if (scanning && scanType === 'face') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
          console.error("Camera error:", err);
          setStatus({ type: 'error', msg: 'Camera Access Denied' });
        });
    }
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [scanning, scanType]);

  const handleVerify = (type) => {
    setScanType(type);
    setScanning(true);
    setStatus(null);

    // 3-second simulation for the demo
    setTimeout(async () => {
      try {
        const response = await axios.get(`${BACKEND}/api/students/${uid}`);
        setStudentData(response.data);
        setScanning(false);
        setStep(3);
      } catch (err) {
        setScanning(false);
        if (err.response?.status === 403) {
          setStep(5); // Already Voted
        } else {
          setStatus({ type: 'error', msg: 'Verification Failed' });
        }
      }
    }, 3000);
  };

  const castVote = async () => {
    if (!selected) return;
    try {
      const res = await axios.post(`${BACKEND}/api/vote`, { uid, candidateID: selected });
      setReceipt(res.data.receipt);
      setStep(4);
    } catch (err) {
      setStatus({ type: 'error', msg: 'Voting Failed' });
    }
  };

  return (
    <div className="portal-container">
      
      {/* STEP 1 — LOGIN (Your original style) */}
      {step === 1 && !scanning && (
        <div className="card">
          <h2 className="title">Student Portal</h2>
          <input 
            className="input-field"
            placeholder="Enter University ID"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
          />
          <div className="btn-group">
            <button className="btn btn-primary" onClick={() => handleVerify('fingerprint')} disabled={!isValidUID(uid)}>
              Fingerprint
            </button>
            <button className="btn btn-secondary" onClick={() => handleVerify('face')} disabled={!isValidUID(uid)}>
              Face ID
            </button>
          </div>
          {status && <p className="error-msg">{status.msg}</p>}
        </div>
      )}

      {/* STEP 2 — SCANNING (Live Camera in your Oval) */}
      {scanning && (
        <div className="card">
          <div className="scan-oval">
             {scanType === 'face' ? (
               <video 
                 ref={videoRef} 
                 autoPlay 
                 playsInline 
                 style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
               />
             ) : (
               <div className="fingerprint-icon">☝️</div>
             )}
             <div className="scan-line"></div>
          </div>
          <h3 className="scanning-title">Verifying Identity...</h3>
        </div>
      )}

      {/* STEP 3 — BALLOT (Your original Candidate list) */}
      {step === 3 && studentData && (
        <div className="card">
          <div className="student-info-header">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`} className="avatar" alt="User" />
             <div>
               <h4>{studentData.name}</h4>
               <p>{uid}</p>
             </div>
          </div>
          <div className="candidate-list">
            {CANDIDATES.map(c => (
              <div 
                key={c.id} 
                className={`candidate-item ${selected === c.id ? 'selected' : ''}`}
                onClick={() => setSelected(c.id)}
              >
                <img src={c.photo} alt={c.name} />
                <span>{c.name}</span>
              </div>
            ))}
          </div>
          <button className="btn-vote" onClick={castVote} disabled={!selected}>Cast Vote</button>
        </div>
      )}

      {/* SUCCESS & ERROR STEPS (Steps 4 & 5 remain as per your original file) */}
      {step === 4 && (
        <div className="card success">
          <h2>Recorded!</h2>
          <p>Receipt: #{receipt}</p>
          <button onClick={onBack}>Finish</button>
        </div>
      )}

      {step === 5 && (
        <div className="card error">
          <h2>Already Voted!</h2>
          <button onClick={() => setStep(1)}>Back</button>
        </div>
      )}
    </div>
  );
}