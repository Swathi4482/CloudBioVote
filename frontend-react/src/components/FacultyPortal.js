import React, { useState, useEffect } from 'react';
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

export default function FacultyPortal({ onBack }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [faculty, setFaculty] = useState('');
  const [status, setStatus] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState('');
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

  const startBiometric = async (type) => {
    if (!faculty) {
      setStatus({ msg: '⚠️ Please select your name first', type: 'error' });
      return;
    }

    // Check if biometric supported
    if (!window.PublicKeyCredential) {
      setStatus({ 
        msg: '❌ Biometric not supported on this device. Please use your phone or a device with fingerprint/face sensor.', 
        type: 'error' 
      });
      return;
    }

    setStatus(null);
    setScanType(type);
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

  return (
    <div className="panel panel-right">
      <div className="panel-header">
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: '#b06080',
          cursor: 'pointer', fontSize: '0.85rem', marginBottom: '8px'
        }}>← Back</button>
        <div className="panel-icon faculty">👩‍🏫</div>
        <h2>Faculty Portal</h2>
        <p>Monitor election results</p>
      </div>

      {/* LOGIN */}
      {!loggedIn && (
        <div className="card">
          {status && <div className={`status-msg status-${status.type}`}>{status.msg}</div>}

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

      {/* RESULTS */}
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
