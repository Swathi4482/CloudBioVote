import React, { useState, useEffect } from 'react';
import { enrollFingerprint, isEnrolled, getWebAuthnErrorMessage } from './webauthn';

const FACULTY_LIST = [
  { id: 'faculty_wanda',  name: 'Prof. Wanda',  department: 'Cloud Computing',         photo: 'https://res.cloudinary.com/dl6rcjggo/image/upload/v1773194156/faculty_wanda.jpg' },
  { id: 'faculty_elena',  name: 'Prof. Elena',  department: 'Artificial Intelligence',  photo: 'https://res.cloudinary.com/dl6rcjggo/image/upload/v1773194143/faculty_elena.jpg' },
  { id: 'faculty_sage',   name: 'Prof. Sage',   department: 'Data Science',             photo: 'https://res.cloudinary.com/dl6rcjggo/image/upload/v1773194135/faculty_sage.jpg' },
  { id: 'faculty_stefan', name: 'Prof. Stefan', department: 'IoT & Cyber Security',     photo: 'https://res.cloudinary.com/dl6rcjggo/image/upload/v1773194125/faculty_stefan.jpg' },
];

export default function EnrollFaculty() {
  const [selectedId, setSelectedId] = useState(FACULTY_LIST[0].id);
  const [status, setStatus]         = useState(null);
  const [enrolling, setEnrolling]   = useState(false);
  const [enrolledMap, setEnrolledMap] = useState({});
  const [autoEnrolling, setAutoEnrolling] = useState(false);
  const [autoProgress, setAutoProgress]   = useState({ current: 0, total: 0, currentName: '' });
  const [stopRequested, setStopRequested] = useState(false);

  // Check enrolled status for all 4 faculty on load
  useEffect(() => {
    const checkAll = async () => {
      const map = {};
      for (const f of FACULTY_LIST) {
        map[f.id] = await isEnrolled(f.id);
      }
      setEnrolledMap(map);
    };
    checkAll();
  }, []);

  const enrolledCount = Object.values(enrolledMap).filter(Boolean).length;
  const selectedFaculty = FACULTY_LIST.find(f => f.id === selectedId);

  // Enroll single faculty
  const handleEnroll = async () => {
    setEnrolling(true);
    setStatus(null);
    try {
      const already = await isEnrolled(selectedId);
      if (already) {
        setStatus({ msg: `⚠️ ${selectedFaculty.name} already enrolled.`, type: 'warning' });
        setEnrolling(false);
        return;
      }
      await enrollFingerprint(selectedId);
      setEnrolledMap(prev => ({ ...prev, [selectedId]: true }));
      setStatus({ msg: `✅ Enrolled: ${selectedFaculty.name}`, type: 'success' });
    } catch (err) {
      setStatus({ msg: getWebAuthnErrorMessage(err), type: 'error' });
    }
    setEnrolling(false);
  };

  // Auto enroll all 4 faculty one by one
  const handleAutoEnroll = async () => {
    setAutoEnrolling(true);
    setStopRequested(false);
    setStatus(null);
    let count = 0;

    for (let i = 0; i < FACULTY_LIST.length; i++) {
      if (stopRequested) break;

      const f = FACULTY_LIST[i];
      const already = await isEnrolled(f.id);

      setAutoProgress({ current: i + 1, total: FACULTY_LIST.length, currentName: f.name });

      if (already) {
        setEnrolledMap(prev => ({ ...prev, [f.id]: true }));
        count++;
        continue;
      }

      setStatus({ msg: `👆 Scan finger for ${f.name} (${i + 1}/${FACULTY_LIST.length})`, type: 'success' });

      try {
        await enrollFingerprint(f.id);
        setEnrolledMap(prev => ({ ...prev, [f.id]: true }));
        count++;
      } catch (err) {
        setStatus({ msg: `❌ Stopped at ${f.name}: ${getWebAuthnErrorMessage(err)}`, type: 'error' });
        setAutoEnrolling(false);
        return;
      }
    }

    setStatus({ msg: `🎉 Done! ${count} faculty members enrolled.`, type: 'success' });
    setAutoEnrolling(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffe0ec, #fff0f5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif', padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '36px',
        maxWidth: '520px', width: '100%',
        boxShadow: '0 8px 32px rgba(255,107,157,0.15)',
        border: '1px solid rgba(255,150,180,0.3)'
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👩‍🏫</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#8b1a4a', marginBottom: '6px' }}>
            Faculty Biometric Enrollment
          </h2>
          <p style={{ color: '#b06080', fontSize: '0.85rem' }}>
            Admin only — 4 Faculty Members
          </p>

          {/* Overall progress */}
          <div style={{ marginTop: '14px', background: 'rgba(255,107,157,0.08)', borderRadius: '12px', padding: '12px' }}>
            <p style={{ fontSize: '0.85rem', color: '#8b1a4a', fontWeight: 600 }}>
              {enrolledCount} / 4 Enrolled
            </p>
            <div style={{ height: '8px', background: 'rgba(255,150,180,0.2)', borderRadius: '4px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(enrolledCount / 4) * 100}%`,
                background: 'linear-gradient(90deg, #ff6b9d, #cc0047)',
                borderRadius: '4px', transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Status */}
        {status && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
            fontSize: '0.85rem', fontWeight: 500,
            background: status.type === 'success' ? 'rgba(100,200,100,0.15)' : status.type === 'warning' ? 'rgba(255,165,0,0.15)' : 'rgba(255,100,100,0.15)',
            color: status.type === 'success' ? '#2d7a2d' : status.type === 'warning' ? '#996600' : '#cc2222',
            border: `1px solid ${status.type === 'success' ? 'rgba(100,200,100,0.3)' : status.type === 'warning' ? 'rgba(255,165,0,0.3)' : 'rgba(255,100,100,0.3)'}`
          }}>
            {status.msg}
          </div>
        )}

        {/* Auto enroll progress */}
        {autoEnrolling && (
          <div style={{ background: 'rgba(255,107,157,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👆</div>
            <p style={{ color: '#8b1a4a', fontWeight: 600, fontSize: '0.9rem' }}>{autoProgress.currentName}</p>
            <p style={{ color: '#b06080', fontSize: '0.78rem', marginTop: '4px' }}>
              Step {autoProgress.current} of {autoProgress.total}
            </p>
            <div style={{ height: '6px', background: 'rgba(255,150,180,0.2)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${autoProgress.total > 0 ? (autoProgress.current / autoProgress.total) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #ff6b9d, #cc0047)',
                borderRadius: '3px', transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* Auto enroll all button */}
        {!autoEnrolling ? (
          <button onClick={handleAutoEnroll} style={{
            width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #ff6b9d, #cc0047)',
            color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginBottom: '12px'
          }}>
            👆 Auto Enroll All 4 Faculty
          </button>
        ) : (
          <button onClick={() => setStopRequested(true)} style={{
            width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
            background: '#cc2222', color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginBottom: '12px'
          }}>
            ⛔ Stop Auto Enroll
          </button>
        )}

        <div style={{ textAlign: 'center', color: '#c0a0b0', fontSize: '0.75rem', marginBottom: '16px' }}>
          — or enroll one at a time —
        </div>

        {/* Faculty selector with photo preview */}
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8b1a4a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
          Select Faculty
        </label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', border: '2px solid rgba(255,150,180,0.3)', borderRadius: '12px', fontSize: '0.9rem', color: '#3d0a20', marginBottom: '14px', outline: 'none', background: 'white' }}
        >
          {FACULTY_LIST.map(f => (
            <option key={f.id} value={f.id}>
              {f.name} — {f.department} {enrolledMap[f.id] ? '✅' : '⬜'}
            </option>
          ))}
        </select>

        {/* Selected faculty photo + details */}
        {selectedFaculty && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            background: 'rgba(255,107,157,0.05)', borderRadius: '14px',
            padding: '14px', marginBottom: '16px',
            border: '1px solid rgba(255,150,180,0.2)'
          }}>
            <img
              src={selectedFaculty.photo}
              alt={selectedFaculty.name}
              style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,107,157,0.4)' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div>
              <p style={{ fontWeight: 700, color: '#3d0a20', fontSize: '0.95rem', margin: 0 }}>{selectedFaculty.name}</p>
              <p style={{ color: '#b06080', fontSize: '0.78rem', margin: '2px 0 0' }}>{selectedFaculty.department}</p>
              <p style={{ color: enrolledMap[selectedFaculty.id] ? '#2d7a2d' : '#cc2222', fontSize: '0.75rem', fontWeight: 600, margin: '4px 0 0' }}>
                {enrolledMap[selectedFaculty.id] ? '✅ Enrolled' : '⬜ Not enrolled'}
              </p>
            </div>
          </div>
        )}

        {!enrolling ? (
          <button onClick={handleEnroll} style={{
            width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #ff9ec4, #ff6b9d)',
            color: 'white', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', marginBottom: '16px'
          }}>
            👆 Enroll This Faculty Member
          </button>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px', marginBottom: '16px' }}>
            <p style={{ color: '#b06080', fontSize: '0.9rem' }}>🔐 Scan your finger...</p>
          </div>
        )}

        {/* Faculty summary cards */}
        <div style={{ borderTop: '1px solid rgba(255,150,180,0.2)', paddingTop: '16px' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8b1a4a', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Enrollment Summary
          </p>
          {FACULTY_LIST.map(f => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 12px', borderRadius: '10px', marginBottom: '8px',
              background: enrolledMap[f.id] ? 'rgba(100,200,100,0.08)' : 'rgba(255,150,180,0.05)',
              border: `1px solid ${enrolledMap[f.id] ? 'rgba(100,200,100,0.25)' : 'rgba(255,150,180,0.15)'}`
            }}>
              <img
                src={f.photo}
                alt={f.name}
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                onError={e => { e.target.style.display = 'none'; }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: '#3d0a20', fontSize: '0.85rem', margin: 0 }}>{f.name}</p>
                <p style={{ color: '#b06080', fontSize: '0.72rem', margin: '1px 0 0' }}>{f.department}</p>
              </div>
              <span style={{ fontSize: '1.1rem' }}>{enrolledMap[f.id] ? '✅' : '⬜'}</span>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#c0a0b0', marginTop: '16px' }}>
          Secret admin page — only accessible via /enroll-faculty
        </p>
      </div>
    </div>
  );
}
