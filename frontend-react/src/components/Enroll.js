import React, { useState } from 'react';
import { enrollFingerprint, isEnrolled, getWebAuthnErrorMessage } from './webauthn';

// Secret enrollment page — only accessible via /enroll URL
// Not linked anywhere in the app

const CLOUD_COMPUTING_UIDS = Array.from({ length: 50 }, (_, i) =>
  `11172304300${i + 1}`.slice(0, 12).padEnd(12, '0')
).map((_, i) => `111723043${String(i + 1).padStart(3, '0')}`);

export default function Enroll() {
  const [uid, setUid] = useState('111723043001');
  const [status, setStatus] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState({});

  const handleEnroll = async () => {
    setEnrolling(true);
    setStatus(null);
    try {
      const already = await isEnrolled(uid);
      if (already) {
        setStatus({ msg: `⚠️ UID ${uid} already has a fingerprint enrolled.`, type: 'warning' });
        setEnrolling(false);
        return;
      }
      await enrollFingerprint(uid);
      setEnrolled(prev => ({ ...prev, [uid]: true }));
      setStatus({ msg: `✅ Fingerprint enrolled for UID ${uid}!`, type: 'success' });
    } catch (err) {
      setStatus({ msg: getWebAuthnErrorMessage(err), type: 'error' });
    }
    setEnrolling(false);
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
        maxWidth: '440px', width: '100%',
        boxShadow: '0 8px 32px rgba(255,107,157,0.15)',
        border: '1px solid rgba(255,150,180,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔐</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#8b1a4a', marginBottom: '6px' }}>
            Biometric Enrollment
          </h2>
          <p style={{ color: '#b06080', fontSize: '0.85rem' }}>
            Admin only — Link fingerprint to Student UID
          </p>
        </div>

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

        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8b1a4a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
          Select Student UID
        </label>
        <select
          value={uid}
          onChange={e => setUid(e.target.value)}
          style={{
            width: '100%', padding: '14px 18px',
            border: '2px solid rgba(255,150,180,0.3)', borderRadius: '12px',
            fontSize: '0.95rem', color: '#3d0a20', marginBottom: '20px',
            outline: 'none', background: 'rgba(255,255,255,0.8)'
          }}
        >
          {CLOUD_COMPUTING_UIDS.map(u => (
            <option key={u} value={u}>
              {u} {enrolled[u] ? '✅' : ''}
            </option>
          ))}
        </select>

        {!enrolling ? (
          <button
            onClick={handleEnroll}
            style={{
              width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #ff6b9d, #cc0047)',
              color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
            }}
          >
            👆 Enroll Fingerprint for this UID
          </button>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#b06080', fontSize: '0.9rem' }}>
              🔐 Place your finger on the scanner...
            </p>
            <p style={{ color: '#c0a0b0', fontSize: '0.78rem', marginTop: '8px' }}>
              Check your device for the biometric prompt
            </p>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#c0a0b0', marginTop: '20px' }}>
          This page is not linked anywhere in the app.<br />
          Only accessible via /enroll URL.
        </p>
      </div>
    </div>
  );
}
