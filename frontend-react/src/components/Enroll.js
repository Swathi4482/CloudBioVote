import React, { useState, useEffect } from 'react';
import { enrollFingerprint, isEnrolled, getWebAuthnErrorMessage } from './webauthn';

const CLOUD_COMPUTING_UIDS = Array.from({ length: 50 }, (_, i) =>
  `111723043${String(i + 1).padStart(3, '0')}`
);

export default function Enroll() {
  const [uid, setUid] = useState('111723043001');
  const [status, setStatus] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolledMap, setEnrolledMap] = useState({});
  const [autoEnrolling, setAutoEnrolling] = useState(false);
  const [autoProgress, setAutoProgress] = useState({ current: 0, total: 50, currentUID: '' });

  // Check which UIDs are already enrolled on load
  useEffect(() => {
    const checkAll = async () => {
      const map = {};
      for (const u of CLOUD_COMPUTING_UIDS) {
        map[u] = await isEnrolled(u);
      }
      setEnrolledMap(map);
    };
    checkAll();
  }, []);

  const enrolledCount = Object.values(enrolledMap).filter(Boolean).length;

  // Enroll single UID
  const handleEnroll = async () => {
    setEnrolling(true);
    setStatus(null);
    try {
      const already = await isEnrolled(uid);
      if (already) {
        setStatus({ msg: `⚠️ UID ${uid} already enrolled.`, type: 'warning' });
        setEnrolling(false);
        return;
      }
      await enrollFingerprint(uid);
      setEnrolledMap(prev => ({ ...prev, [uid]: true }));
      setStatus({ msg: `✅ Enrolled: ${uid}`, type: 'success' });
    } catch (err) {
      setStatus({ msg: getWebAuthnErrorMessage(err), type: 'error' });
    }
    setEnrolling(false);
  };

  // Auto enroll all 50
  const handleAutoEnrollAll = async () => {
    setAutoEnrolling(true);
    setStatus(null);

    let count = 0;
    for (let i = 0; i < CLOUD_COMPUTING_UIDS.length; i++) {
      const u = CLOUD_COMPUTING_UIDS[i];

      // Skip already enrolled
      const already = await isEnrolled(u);
      if (already) {
        setEnrolledMap(prev => ({ ...prev, [u]: true }));
        count++;
        setAutoProgress({ current: i + 1, total: 50, currentUID: u });
        continue;
      }

      setAutoProgress({ current: i + 1, total: 50, currentUID: u });
      setStatus({ msg: `👆 Scan finger for UID ${u} (${i + 1}/50)`, type: 'success' });

      try {
        await enrollFingerprint(u);
        setEnrolledMap(prev => ({ ...prev, [u]: true }));
        count++;
      } catch (err) {
        setStatus({ msg: `❌ Failed at ${u}: ${getWebAuthnErrorMessage(err)}`, type: 'error' });
        setAutoEnrolling(false);
        return;
      }
    }

    setStatus({ msg: `🎉 All ${count} UIDs enrolled successfully!`, type: 'success' });
    setAutoEnrolling(false);
  };

  const stopAuto = () => {
    setAutoEnrolling(false);
    setStatus({ msg: '⚠️ Auto enroll stopped.', type: 'warning' });
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
        maxWidth: '480px', width: '100%',
        boxShadow: '0 8px 32px rgba(255,107,157,0.15)',
        border: '1px solid rgba(255,150,180,0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔐</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#8b1a4a', marginBottom: '6px' }}>
            Biometric Enrollment
          </h2>
          <p style={{ color: '#b06080', fontSize: '0.85rem' }}>
            Cloud Computing Department — 50 Students
          </p>
          {/* Progress */}
          <div style={{
            marginTop: '14px', background: 'rgba(255,107,157,0.08)',
            borderRadius: '12px', padding: '12px'
          }}>
            <p style={{ fontSize: '0.85rem', color: '#8b1a4a', fontWeight: 600 }}>
              {enrolledCount} / 50 Enrolled
            </p>
            <div style={{ height: '8px', background: 'rgba(255,150,180,0.2)', borderRadius: '4px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(enrolledCount / 50) * 100}%`,
                background: 'linear-gradient(90deg, #ff6b9d, #cc0047)',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
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
          <div style={{
            background: 'rgba(255,107,157,0.05)', borderRadius: '12px',
            padding: '16px', marginBottom: '16px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👆</div>
            <p style={{ color: '#8b1a4a', fontWeight: 600, fontSize: '0.9rem' }}>
              Enrolling {autoProgress.currentUID}
            </p>
            <p style={{ color: '#b06080', fontSize: '0.78rem', marginTop: '4px' }}>
              Step {autoProgress.current} of {autoProgress.total}
            </p>
            <div style={{ height: '6px', background: 'rgba(255,150,180,0.2)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(autoProgress.current / autoProgress.total) * 100}%`,
                background: 'linear-gradient(90deg, #ff6b9d, #cc0047)',
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* Auto Enroll All button */}
        {!autoEnrolling ? (
          <button onClick={handleAutoEnrollAll} style={{
            width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #ff6b9d, #cc0047)',
            color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
            marginBottom: '12px'
          }}>
            👆 Auto Enroll All 50 Students
          </button>
        ) : (
          <button onClick={stopAuto} style={{
            width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
            background: '#cc2222', color: 'white', fontSize: '1rem',
            fontWeight: 600, cursor: 'pointer', marginBottom: '12px'
          }}>
            ⛔ Stop Auto Enroll
          </button>
        )}

        <div style={{ textAlign: 'center', color: '#c0a0b0', fontSize: '0.75rem', marginBottom: '20px' }}>
          — or enroll one at a time —
        </div>

        {/* Single enroll */}
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8b1a4a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
          Select UID
        </label>
        <select value={uid} onChange={e => setUid(e.target.value)} style={{
          width: '100%', padding: '14px 18px',
          border: '2px solid rgba(255,150,180,0.3)', borderRadius: '12px',
          fontSize: '0.95rem', color: '#3d0a20', marginBottom: '14px',
          outline: 'none', background: 'rgba(255,255,255,0.8)'
        }}>
          {CLOUD_COMPUTING_UIDS.map(u => (
            <option key={u} value={u}>
              {u} {enrolledMap[u] ? '✅' : '⬜'}
            </option>
          ))}
        </select>

        {!enrolling ? (
          <button onClick={handleEnroll} style={{
            width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #ff9ec4, #ff6b9d)',
            color: 'white', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer'
          }}>
            👆 Enroll This UID
          </button>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <p style={{ color: '#b06080', fontSize: '0.9rem' }}>🔐 Scan your finger...</p>
          </div>
        )}

        {/* Enrolled list */}
        <div style={{ marginTop: '20px', maxHeight: '200px', overflowY: 'auto' }}>
          {CLOUD_COMPUTING_UIDS.map(u => (
            <div key={u} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 10px', borderRadius: '8px', fontSize: '0.78rem',
              background: enrolledMap[u] ? 'rgba(100,200,100,0.08)' : 'transparent',
              color: enrolledMap[u] ? '#2d7a2d' : '#b06080',
              marginBottom: '2px'
            }}>
              <span>{u}</span>
              <span>{enrolledMap[u] ? '✅ Enrolled' : '⬜ Not enrolled'}</span>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#c0a0b0', marginTop: '16px' }}>
          Secret admin page — not linked in the app
        </p>
      </div>
    </div>
  );
}