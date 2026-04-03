/* eslint-disable */
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// Keeping your original backend and candidate data
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
  // Your original AMU UID ranges
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

  // Function to turn on camera - only used for Face ID
  useEffect(() => {
    let stream = null;
    if (scanning && scanType === 'face') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => console.error("Camera access error:", err));
    }
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [scanning, scanType]);

  const handleVerify = (type) => {
    setScanType(type);
    setScanning(true);
    setStatus(null);

    // This is the 3-second simulation for your demo
    setTimeout(async () => {
      try {
        const response = await axios.get(`${BACKEND}/api/students/${uid}`);
        setStudentData(response.data);
        setScanning(false);
        setStep(3); // Success: Show Details & Ballot
      } catch (err) {
        setScanning(false);
        if (err.response?.status === 403) {
          setStep(5); // Show "Already Voted" page
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
      setStep(4); // Show Success/Receipt
    } catch (err) {
      setStatus({ type: 'error', msg: 'Voting Failed. Please try again.' });
    }
  };

  return (
    <div className="portal-container" style={{padding:'20px', maxWidth:'500px', margin:'0 auto', fontFamily:'sans-serif'}}>
      
      {/* STEP 1: LOGIN */}
      {step === 1 && !scanning && (
        <div className="card" style={{background:'#fff', padding:'30px', borderRadius:'20px', boxShadow:'0 10px 30px rgba(255,107,157,0.1)', textAlign:'center'}}>
          <h2 style={{color:'#ff6b9d', marginBottom:'10px'}}>Student Portal</h2>
          <p style={{color:'#b06080', fontSize:'0.9rem', marginBottom:'20px'}}>Enter UID to access the Ballot</p>
          
          <input 
            type="text"
            className="input-field"
            placeholder="Enter University ID"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #ffcada', marginBottom:'20px', outline:'none'}}
          />
          
          <div style={{display:'flex', gap:'10px'}}>
            <button 
              onClick={() => handleVerify('fingerprint')} 
              disabled={!isValidUID(uid)}
              style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', background:'#ff6b9d', color:'#fff', cursor:'pointer', opacity: isValidUID(uid)? 1 : 0.5}}
            >
              Fingerprint
            </button>
            <button 
              onClick={() => handleVerify('face')} 
              disabled={!isValidUID(uid)}
              style={{flex:1, padding:'12px', borderRadius:'10px', border:'1px solid #ff6b9d', background:'#fff', color:'#ff6b9d', cursor:'pointer', opacity: isValidUID(uid)? 1 : 0.5}}
            >
              Face ID
            </button>
          </div>
          {status && <p style={{color:'red', marginTop:'10px'}}>{status.msg}</p>}
        </div>
      )}

      {/* STEP 2: SCANNING ANIMATION WITH LIVE CAMERA */}
      {scanning && (
        <div className="card" style={{textAlign:'center', padding:'40px 20px', background:'#fff', borderRadius:'20px'}}>
          <div className="scan-oval" style={{
            width:'180px', height:'240px', margin:'0 auto 20px', border:'4px solid #ff6b9d', borderRadius:'50%', 
            overflow:'hidden', position:'relative', background:'#fff0f5'
          }}>
            {scanType === 'face' ? (
              <video ref={videoRef} autoPlay playsInline style={{width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)'}} />
            ) : (
              <div style={{fontSize:'80px', marginTop:'60px'}}>☝️</div>
            )}
            {/* The Moving Scan Line */}
            <div className="scan-line" style={{
              position:'absolute', width:'100%', height:'4px', background:'#ff6b9d', top:'0', left:'0',
              boxShadow:'0 0 15px #ff6b9d', animation: 'scanMove 2s infinite ease-in-out'
            }}></div>
          </div>
          <h3 style={{color:'#ff6b9d'}}>Verifying Identity...</h3>
          <p style={{color:'#b06080', fontSize:'0.8rem'}}>System is matching your biometrics with AMU records</p>
        </div>
      )}

      {/* STEP 3: DETAILS & BALLOT (DOUBLE MASKING) */}
      {step === 3 && studentData && (
        <div className="card" style={{background:'#fff', padding:'20px', borderRadius:'20px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'15px', borderBottom:'1px solid #eee', paddingBottom:'15px', marginBottom:'20px'}}>
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`} 
              style={{width:'60px', height:'60px', borderRadius:'50%', background:'#fff0f5'}} 
              alt="Avatar" 
            />
            <div style={{textAlign:'left'}}>
              <h4 style={{margin:0, color:'#3d0a20'}}>{studentData.name}</h4>
              <p style={{margin:0, fontSize:'0.8rem', color:'#b06080'}}>{studentData.dept} | Verified ✅</p>
            </div>
          </div>

          <h5 style={{color:'#ff6b9d', marginBottom:'15px'}}>Cast Your Secret Ballot</h5>
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {CANDIDATES.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelected(c.id)}
                style={{
                  display:'flex', alignItems:'center', gap:'15px', padding:'10px', borderRadius:'12px', border: selected === c.id ? '2px solid #ff6b9d' : '1px solid #eee',
                  cursor:'pointer', background: selected === c.id ? '#fff0f5' : '#fff', transition:'0.3s'
                }}
              >
                <img src={c.photo} style={{width:'45px', height:'45px', borderRadius:'8px', objectFit:'cover'}} alt={c.name} />
                <span style={{fontWeight:500, color:'#3d0a20'}}>{c.name}</span>
              </div>
            ))}
          </div>
          
          <button 
            onClick={castVote} 
            disabled={!selected}
            style={{
              width:'100%', marginTop:'20px', padding:'15px', borderRadius:'12px', border:'none', 
              background:'#ff6b9d', color:'#fff', fontWeight:'bold', cursor:'pointer', opacity: selected ? 1 : 0.5
            }}
          >
            Confirm Vote
          </button>
        </div>
      )}

      {/* STEP 4: SUCCESS RECEIPT */}
      {step === 4 && (
        <div className="card" style={{textAlign:'center', padding:'40px 20px', background:'#fff', borderRadius:'20px'}}>
          <div style={{fontSize:'60px', marginBottom:'10px'}}>🎉</div>
          <h2 style={{color:'#ff6b9d'}}>Vote Recorded!</h2>
          <p style={{color:'#b06080'}}>Thank you for participating.</p>
          <div style={{background:'#fff0f5', padding:'15px', borderRadius:'10px', marginTop:'20px', border:'1px dashed #ff6b9d'}}>
            <p style={{margin:0, fontSize:'0.8rem', color:'#3d0a20'}}>Encrypted Receipt ID:</p>
            <p style={{margin:0, fontWeight:'bold', color:'#ff6b9d'}}>#{receipt}</p>
          </div>
          <button onClick={onBack} style={{marginTop:'30px', padding:'10px 20px', borderRadius:'10px', border:'none', background:'#ff6b9d', color:'#fff', cursor:'pointer'}}>Logout</button>
        </div>
      )}

      {/* STEP 5: ALREADY VOTED */}
      {step === 5 && (
        <div className="card" style={{textAlign:'center', padding:'40px 20px', background:'#fff', borderRadius:'20px'}}>
          <div style={{fontSize:'60px', marginBottom:'10px'}}>🚫</div>
          <h2 style={{color:'#cc0047'}}>Access Denied</h2>
          <p style={{color:'#cc0047', fontWeight:'bold'}}>You have already voted!</p>
          <button onClick={() => setStep(1)} style={{marginTop:'20px', padding:'10px 20px', borderRadius:'10px', border:'none', background:'#ff6b9d', color:'#fff', cursor:'pointer'}}>Go Back</button>
        </div>
      )}

      {/* Add this CSS to your App.css or a style tag */}
      <style>{`
        @keyframes scanMove {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
}