import React, { useState, useEffect } from 'react';
import { enrollFingerprint, isEnrolled, getWebAuthnErrorMessage } from './webauthn';

const DEPARTMENTS = [
  { name: 'Cloud Computing',         prefix: '111723043', color: '#ff6b9d' },
  { name: 'Artificial Intelligence', prefix: '111723044', color: '#cc0047' },
  { name: 'Data Science',            prefix: '111723045', color: '#7b61ff' },
  { name: 'IoT',                     prefix: '111723046', color: '#ff9500' },
  { name: 'Cyber Security',          prefix: '111723047', color: '#2d9a6b' },
];

// Generate all 250 UIDs
const ALL_UIDS = DEPARTMENTS.flatMap(dept =>
  Array.from({ length: 50 }, (_, i) => ({
    uid: `${dept.prefix}${String(i + 1).padStart(3, '0')}`,
    dept: dept.name,
    color: dept.color,
  }))
);

export default function Enroll() {
  const [selectedDept, setSelectedDept] = useState('All');
  const [uid, setUid] = useState(ALL_UIDS[0].uid);
  const [status, setStatus] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolledMap, setEnrolledMap] = useState({});
  const [autoEnrolling, setAutoEnrolling] = useState(false);
  const [autoProgress, setAutoProgress] = useState({ current: 0, total: 0, currentUID: '', currentDept: '' });
  const [stopRequested, setStopRequested] = useState(false);

  // Check all enrolled on load
  useEffect(() => {
    const checkAll = async () => {
      const map = {};
      for (const { uid } of ALL_UIDS) {
        map[uid] = await isEnrolled(uid);
      }
      setEnrolledMap(map);
    };
    checkAll();
  }, []);

  const enrolledCount = Object.values(enrolledMap).filter(Boolean).length;

  const filteredUIDs = selectedDept === 'All'
    ? ALL_UIDS
    : ALL_UIDS.filter(u => u.dept === selectedDept);

  // Enroll single UID
  const handleEnroll = async () => {
    setEnrolling(true);
    setStatus(null);
    try {
      const already = await isEnrolled(uid);
      if (already) {
        setStatus({ msg: `⚠️ ${uid} already enrolled.`, type: 'warning' });
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

  // Auto enroll all in selected dept or all 250
  const handleAutoEnroll = async () => {
    setAutoEnrolling(true);
    setStopRequested(false);
    setStatus(null);

    const toEnroll = filteredUIDs;
    let count = 0;

    for (let i = 0; i < toEnroll.length; i++) {
      if (stopRequested) break;

      const { uid: u, dept } = toEnroll[i];
      const already = await isEnrolled(u);

      if (already) {
        setEnrolledMap(prev => ({ ...prev, [u]: true }));
        count++;
        setAutoProgress({ current: i + 1, total: toEnroll.length, currentUID: u, currentDept: dept });
        continue;
      }

      setAutoProgress({ current: i + 1, total: toEnroll.length, currentUID: u, currentDept: dept });
      setStatus({ msg: `👆 Scan finger for UID ${u} (${i + 1}/${toEnroll.length})`, type: 'success' });

      try {
        await enrollFingerprint(u);
        setEnrolledMap(prev => ({ ...prev, [u]: true }));
        count++;
      } catch (err) {
        setStatus({ msg: `❌ Stopped at ${u}: ${getWebAuthnErrorMessage(err)}`, type: 'error' });
        setAutoEnrolling(false);
        return;
      }
    }

    setStatus({ msg: `🎉 Done! ${count} UIDs enrolled.`, type: 'success' });
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
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔐</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#8b1a4a', marginBottom: '6px' }}>
            Biometric Enrollment
          </h2>
          <p style={{ color: '#b06080', fontSize: '0.85rem' }}>
            Admin only — 5 Departments • 250 Students
          </p>

          {/* Overall progress */}
          <div style={{ marginTop: '14px', background: 'rgba(255,107,157,0.08)', borderRadius: '12px', padding: '12px' }}>
            <p style={{ fontSize: '0.85rem', color: '#8b1a4a', fontWeight: 600 }}>
              {enrolledCount} / 250 Enrolled
            </p>
            <div style={{ height: '8px', background: 'rgba(255,150,180,0.2)', borderRadius: '4px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(enrolledCount / 250) * 100}%`,
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
            <p style={{ color: '#8b1a4a', fontWeight: 600, fontSize: '0.9rem' }}>{autoProgress.currentUID}</p>
            <p style={{ color: '#b06080', fontSize: '0.78rem' }}>{autoProgress.currentDept}</p>
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

        {/* Department filter */}
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8b1a4a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
          Filter by Department
        </label>
        <select
          value={selectedDept}
          onChange={e => { setSelectedDept(e.target.value); }}
          style={{ width: '100%', padding: '12px 16px', border: '2px solid rgba(255,150,180,0.3)', borderRadius: '12px', fontSize: '0.9rem', color: '#3d0a20', marginBottom: '14px', outline: 'none', background: 'white' }}
        >
          <option value="All">All Departments (250 students)</option>
          {DEPARTMENTS.map(d => (
            <option key={d.name} value={d.name}>{d.name} (50 students)</option>
          ))}
        </select>

        {/* Auto enroll button */}
        {!autoEnrolling ? (
          <button onClick={handleAutoEnroll} style={{
            width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #ff6b9d, #cc0047)',
            color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginBottom: '12px'
          }}>
            👆 Auto Enroll — {selectedDept === 'All' ? 'All 250 Students' : `${selectedDept} (50)`}
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

        {/* Single enroll */}
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8b1a4a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
          Select UID
        </label>
        <select
          value={uid}
          onChange={e => setUid(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', border: '2px solid rgba(255,150,180,0.3)', borderRadius: '12px', fontSize: '0.9rem', color: '#3d0a20', marginBottom: '14px', outline: 'none', background: 'white' }}
        >
          {filteredUIDs.map(u => (
            <option key={u.uid} value={u.uid}>
              {u.uid} — {u.dept} {enrolledMap[u.uid] ? '✅' : '⬜'}
            </option>
          ))}
        </select>

        {!enrolling ? (
          <button onClick={handleEnroll} style={{
            width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #ff9ec4, #ff6b9d)',
            color: 'white', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', marginBottom: '16px'
          }}>
            👆 Enroll This UID
          </button>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px', marginBottom: '16px' }}>
            <p style={{ color: '#b06080', fontSize: '0.9rem' }}>🔐 Scan your finger...</p>
          </div>
        )}

        {/* Per-department summary */}
        <div style={{ borderTop: '1px solid rgba(255,150,180,0.2)', paddingTop: '16px' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8b1a4a', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Department Summary
          </p>
          {DEPARTMENTS.map(dept => {
            const deptUIDs = ALL_UIDS.filter(u => u.dept === dept.name);
            const deptEnrolled = deptUIDs.filter(u => enrolledMap[u.uid]).length;
            return (
              <div key={dept.name} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                  <span style={{ color: '#3d0a20', fontWeight: 600 }}>{dept.name}</span>
                  <span style={{ color: dept.color, fontWeight: 700 }}>{deptEnrolled}/50</span>
                </div>
                <div style={{ height: '5px', background: 'rgba(255,150,180,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(deptEnrolled / 50) * 100}%`, background: dept.color, borderRadius: '3px', transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#c0a0b0', marginTop: '16px' }}>
          Secret admin page — only accessible via /enroll
        </p>
      </div>
    </div>
  );
}
