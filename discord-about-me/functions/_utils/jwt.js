const enc = s => new TextEncoder().encode(s);
const b64url = s => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
const fromb64url = s => atob(s.replace(/-/g, '+').replace(/_/g, '/'));

export async function createJWT(secret, payload, expiresInMs) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + expiresInMs) / 1000),
  }));
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw', enc(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc(data));
  return `${data}.${b64url(String.fromCharCode(...new Uint8Array(sig)))}`;
}

export async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const key = await crypto.subtle.importKey(
      'raw', enc(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const sigBytes = Uint8Array.from(fromb64url(s), c => c.charCodeAt(0));
    if (!await crypto.subtle.verify('HMAC', key, sigBytes, enc(`${h}.${p}`))) return null;
    const payload = JSON.parse(fromb64url(p));
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function sha256hex(input) {
  const buf = await crypto.subtle.digest('SHA-256', enc(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
