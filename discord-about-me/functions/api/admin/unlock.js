import { createJWT, sha256hex, jsonResponse } from '../../_utils/jwt.js';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'Invalid request.' }, 400); }

  const { password } = body ?? {};
  if (!password || typeof password !== 'string') return jsonResponse({ error: 'Password required.' }, 400);

  if (!env.ADMIN_HASH) return jsonResponse({ error: 'Admin not configured.' }, 500);

  const hash = await sha256hex(password);

  // Constant-time string comparison to prevent timing attacks
  const expected = env.ADMIN_HASH;
  if (hash.length !== expected.length || !timingSafeEqual(hash, expected)) {
    return jsonResponse({ error: 'Invalid master password.' }, 401);
  }

  const token = await createJWT(env.JWT_SECRET, { role: 'admin' }, 60 * 60 * 1000); // 1 hour
  return jsonResponse({ success: true, token });
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
