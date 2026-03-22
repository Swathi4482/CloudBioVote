/* eslint-disable no-undef */
const CRED_PREFIX = 'biovote_cred_';

function getCredKey(uid) {
  return CRED_PREFIX + uid;
}

export async function isEnrolled(uid) {
  return !!localStorage.getItem(getCredKey(uid));
}

export async function hasBiometricSensor() {
  if (!window.PublicKeyCredential) return false;
  return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

// Enroll — forces cross-device (QR) by setting transport to hybrid
export async function enrollFingerprint(uid) {
  if (!window.PublicKeyCredential) throw new Error('WebAuthn not supported. Use Chrome, Safari or Edge.');

  const challenge = window.crypto.getRandomValues(new Uint8Array(32));

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'AMU CloudBioVote', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode('AMU_' + uid),
        name: `${uid}@amu.edu`,
        displayName: `Student ${uid}`,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'cross-platform', // forces QR code flow
        userVerification: 'required',
        requireResidentKey: true,
        residentKey: 'required',
      },
      timeout: 120000,
      attestation: 'none',
    }
  });

  const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
  localStorage.setItem(getCredKey(uid), credId);
  return credential;
}

// Verify — uses hybrid transport to trigger QR
export async function verifyFingerprint(uid) {
  if (!window.PublicKeyCredential) throw new Error('WebAuthn not supported. Use Chrome, Safari or Edge.');

  const storedCredId = localStorage.getItem(getCredKey(uid));
  if (!storedCredId) throw new Error('NOT_ENROLLED');

  const challenge = window.crypto.getRandomValues(new Uint8Array(32));
  const credIdBytes = Uint8Array.from(atob(storedCredId), c => c.charCodeAt(0));

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 120000,
      allowCredentials: [{
        type: 'public-key',
        id: credIdBytes,
        transports: ['hybrid', 'internal'], // hybrid = QR code cross device
      }],
    }
  });

  return assertion;
}

export function getWebAuthnErrorMessage(err) {
  if (err.message === 'NOT_ENROLLED') return '❌ No biometric registered for this UID.';
  switch (err.name) {
    case 'NotAllowedError': return '❌ Biometric cancelled or timed out. Please try again.';
    case 'NotSupportedError': return '⚠️ Biometric not supported. Use Chrome, Safari or Edge.';
    case 'SecurityError': return '⚠️ Security error. Make sure you are on HTTPS.';
    case 'InvalidStateError': return '⚠️ Already enrolled. Try verifying instead.';
    default: return err.message || '⚠️ Biometric failed. Please try again.';
  }
}