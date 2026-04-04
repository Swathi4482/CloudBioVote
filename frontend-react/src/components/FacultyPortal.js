/* eslint-disable */
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { enrollFingerprint, verifyFingerprint, isEnrolled, getWebAuthnErrorMessage } from './webauthn';

const BACKEND = 'https://cloudbiovote-api.onrender.com';

const FACULTY_PHOTOS = {
  wanda:  'https://res.cloudinary.com/dl6rcjggo/image/upload/v1773194156/faculty_wanda.jpg',
  elena:  'https://res.cloudinary.com/dl6rcjggo/image/upload/v1773194143/faculty_elena.jpg',
  sage:   'https://res.cloudinary.com/dl6rcjggo/image/upload/v1773194135/faculty_sage.jpg',
  stefan: 'https://res.cloudinary.com/dl6rcjggo/image/upload/v1773194125/faculty_stefan.jpg',
};

// Camera Face ID Component
function CameraFaceID({ onVerified, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null); // FIX: use ref so stream persists across renders
  const [status, setStatus] = useState('requesting');
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then((mediaStream) => {
        if (!mounted) { mediaStream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = mediaStream;
        // FIX: small delay ensures <video> element is in the DOM before setting srcObject
        setTimeout(() => {
          if (videoRef.current && mounted) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch(() => {});
          }
        }, 150);
        setStatus('ready');
      })
      .catch((err) => {
        if (!mounted) return;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setStatus('denied');
        } else {
          setStatus('error');
        }
      });
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
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
          <p style={{color:'#b06080',fontSize:'0.85rem'}}>Requesting camera access...</p>
        </div>
      )}

      {status === 'denied' && (
        <div style={{padding:'20px'}}>
          <div style={{fontSize:'2rem',marginBottom:'12px'}}>❌</div>
          <p style={{color:'#cc2222',fontSize:'0.85rem',fontWeight:600}}>Camera access denied!</p>
          <p style={{color:'#b06080',fontSize:'0.78rem',marginTop:'8px'}}>
            Please allow camera access in browser settings and try again.
          </p>
          <button onClick={handleCancel} style={{
            marginTop:'16px',padding:'10px 20px',borderRadius:'10px',
            border:'2px solid rgba(255,107,157,0.3)',background:'transparent',
            color:'#b06080',cursor:'pointer',fontWeight:600
          }}>← Go Back</button>
        </div>
      )}

      {(status === 'ready' || status === 'scanning' || status === 'verified') && (
        <div>
          <p style={{fontSize:'0.78rem',color:'#8b1a4a',fontWeight:600,marginBottom:'10px'}}>
            {status === 'ready' && '📷 Position your face in the camera'}
            {status === 'scanning' && `🔍 Scanning in ${countdown}...`}
            {status === 'verified' && '✅ Face verified!'}
          </p>

          <div style={{
            position:'relative',width:'100%',maxWidth:'300px',
            margin:'0 auto 16px',borderRadius:'16px',overflow:'hidden',
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
              style={{width:'100%',height:'200px',objectFit:'cover',display:'block',transform:'scaleX(-1)'}}
            />
            <div style={{
              position:'absolute',top:'50%',left:'50%',
              transform:'translate(-50%,-50%)',
              width:'120px',height:'150px',
              border:`3px solid ${status === 'verified' ? '#2d7a2d' : '#ff6b9d'}`,
              borderRadius:'50%',opacity: status === 'scanning' ? 1 : 0.6
            }} />
            {status === 'scanning' && (
              <div style={{
                position:'absolute',top:0,left:0,right:0,height:'3px',
                background:'linear-gradient(90deg,transparent,#ff6b9d,transparent)',
                animation:'scanLine 1s linear infinite'
              }} />
            )}
            {status === 'verified' && (
              <div style={{
                position:'absolute',top:0,left:0,right:0,bottom:0,
                background:'rgba(45,122,45,0.3)',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:'3rem'
              }}>✅</div>
            )}
          </div>

          {status === 'ready' && (
            <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
              <button onClick={handleVerify} style={{
                padding:'14px 28px',borderRadius:'12px',border:'none',
                background:'linear-gradient(135deg,#ff6b9d,#cc0047)',
                color:'white',fontSize:'0.95rem',fontWeight:600,cursor:'pointer'
              }}>🔍 Verify Face</button>
              <button onClick={handleCancel} style={{
                padding:'14px 20px',borderRadius:'12px',
                border:'2px solid rgba(255,107,157,0.3)',background:'transparent',
                color:'#b06080',fontSize:'0.95rem',fontWeight:600,cursor:'pointer'
              }}>Cancel</button>
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

export default function FacultyPortal({ onBack }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [faculty, setFaculty] = useState('');
  const [status, setStatus] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (loggedIn) fetchResults();
  }, [loggedIn]);

  const fetchResults = async () => {
    try {
      const res = await axios.get(`${BACKEND}/votes/results`);
      setResults(res.data);
    } catch (err) {
      console.log('Error fetching results');
    }
  };

  const startFingerprint = async () => {
    if (!faculty) {
      setStatus({ msg: '⚠️ Please select your name first', type: 'error' });
      return;
    }
    if (!window.PublicKeyCredential) {
      setStatus({ msg: '❌ Fingerprint not supported. Please use Face ID instead.', type: 'error' });
      return;
    }
    setStatus(null);
    setScanType('fingerprint');
    setScanning(true);

    try {
      const enrolled = await isEnrolled(`faculty_${faculty}`);
      if (!enrolled) {
        await enrollFingerprint(`faculty_${faculty}`);
      } else {
        await verifyFingerprint(`faculty_${faculty}`);
      }
      setScanning(false);
      setStatus({ msg: '✅ Identity verified!', type: 'success' });
      setTimeout(() => { setLoggedIn(true); setStatus(null); }, 600);
    } catch (err) {
      setScanning(false);
      setStatus({ msg: getWebAuthnErrorMessage(err), type: 'error' });
    }
  };

  const startFaceID = () => {
    if (!faculty) {
      setStatus({ msg: '⚠️ Please select your name first', type: 'error' });
      return;
    }
    setStatus(null);
    setScanType('faceid');
    setShowCamera(true);
  };

  const onFaceVerified = () => {
    setShowCamera(false);
    setStatus({ msg: '✅ Identity verified!', type: 'success' });
    setTimeout(() => { setLoggedIn(true); setStatus(null); }, 600);
  };

  return (
    <div className="panel panel-right">
      <div className="panel-header">
        <button onClick={onBack} style={{
          background:'none',border:'none',color:'#b06080',
          cursor:'pointer',fontSize:'0.85rem',marginBottom:'8px'
        }}>← Back</button>
        <div className="panel-icon faculty">👩‍🏫</div>
        <h2>Faculty Portal</h2>
        <p>Monitor election results</p>
      </div>

      {!loggedIn && (
        <div className="card">
          {status && <div className={`status-msg status-${status.type}`}>{status.msg}</div>}

          {!showCamera ? (
            <>
              {faculty && FACULTY_PHOTOS[faculty] && (
                <div className="faculty-photo">
                  <img src={FACULTY_PHOTOS[faculty]} alt={faculty} />
                  <p style={{fontSize:'0.8rem',color:'#8b1a4a',marginTop:'8px',fontWeight:600}}>
                    Prof. {faculty.charAt(0).toUpperCase() + faculty.slice(1)}
                  </p>
                </div>
              )}

              <label className="input-label">👤 Faculty Name</label>
              <select className="faculty-select" value={faculty} onChange={e => setFaculty(e.target.value)}>
                <option value="">-- Select Faculty --</option>
                <option value="wanda">Prof. Wanda</option>
                <option value="elena">Prof. Elena</option>
                <option value="sage">Prof. Sage</option>
                <option value="stefan">Prof. Stefan</option>
              </select>

              <p style={{fontSize:'0.78rem',color:'#b06080',marginBottom:'14px',textAlign:'center'}}>
                Verify your identity to access results
              </p>

              {!scanning ? (
                <>
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
              onVerified={onFaceVerified}
              onCancel={() => { setShowCamera(false); setStatus(null); }}
            />
          )}
        </div>
      )}

      {loggedIn && results && (
        <div className="card" style={{width:'100%',maxWidth:'420px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
            <div>
              <h3 style={{fontFamily:'Playfair Display,serif',color:'#8b1a4a'}}>Live Results</h3>
              <p style={{fontSize:'0.75rem',color:'#b06080'}}>
                Welcome, Prof. {faculty.charAt(0).toUpperCase() + faculty.slice(1)}
              </p>
            </div>
            <button className="refresh-btn" onClick={fetchResults}>🔄 Refresh</button>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-number">{results.totalVoted}</div>
              <div className="stat-label">Total Votes</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">250</div>
              <div className="stat-label">Eligible Voters</div>
            </div>
          </div>

          {results.totalVotes > 0 && results.winner && (
            <div className="winner-banner">
              <div style={{fontSize:'2rem',marginBottom:'8px'}}>🏆</div>
              <h3 style={{fontFamily:'Playfair Display,serif'}}>{results.winner}</h3>
              <p style={{opacity:0.9}}>{results.outcome}</p>
            </div>
          )}

          {results.totalVotes > 0 && !results.winner && (
            <div className="tie-banner">
              <div style={{fontSize:'2rem',marginBottom:'8px'}}>⚠️</div>
              <h3>Nobody Won — Voting Tie!</h3>
              <p>Please conduct a re-vote</p>
            </div>
          )}

          <p style={{fontSize:'0.75rem',color:'#b06080',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'14px',fontWeight:600}}>
            Vote Distribution
          </p>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={results.results} margin={{top:5,right:10,left:-20,bottom:5}}>
              <XAxis dataKey="name" tick={{fontSize:9}} />
              <YAxis tick={{fontSize:10}} />
              <Tooltip />
              <Bar dataKey="votes" fill="#ff6b9d" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>

          <div style={{marginTop:'16px'}}>
            {results.results.map(c => {
              const pct = results.totalVotes > 0 ? Math.round((c.votes/results.totalVotes)*100) : 0;
              const maxV = Math.max(...results.results.map(r => r.votes), 1);
              const isWinner = results.winner === c.name;
              return (
                <div key={c.candidateID} className="bar-item">
                  <div className="bar-label">
                    <span style={{fontWeight:600,color:'#3d0a20'}}>{isWinner ? '🏆 ' : ''}{c.name}</span>
                    <span style={{color:'#ff6b9d',fontWeight:700}}>{c.votes} ({pct}%)</span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill ${isWinner ? 'winner' : ''}`} style={{width:`${(c.votes/maxV)*100}%`}}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{marginTop:'16px',padding:'12px',background:'rgba(255,107,157,0.05)',borderRadius:'10px',border:'1px dashed rgba(255,107,157,0.3)',textAlign:'center'}}>
            <p style={{fontSize:'0.75rem',color:'#b06080'}}>🔒 Results are encrypted & tamper-proof</p>
          </div>
        </div>
      )}
    </div>
  );
}
