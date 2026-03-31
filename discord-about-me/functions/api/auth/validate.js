import { createJWT, sha256hex, jsonResponse } from '../../_utils/jwt.js';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'Invalid request.' }, 400); }

  const { password } = body ?? {};
  if (!password || typeof password !== 'string' || password.length > 64) {
    return jsonResponse({ error: 'Password required.' }, 400);
  }

  // Rate limit: 5 attempts per IP per 15 min
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateKey = `rate:${ip}`;
  let rate = await env.OTP_STORE.get(rateKey, 'json') || { count: 0, resetAt: Date.now() + 900000 };
  if (Date.now() > rate.resetAt) rate = { count: 0, resetAt: Date.now() + 900000 };
  if (rate.count >= 5) return jsonResponse({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);

  // Load password pool
  const pool = await env.OTP_STORE.get('pool', 'json');
  if (!pool) return jsonResponse({ error: 'No passwords generated yet.' }, 401);

  const entry = pool.passwords[password];

  if (entry === undefined || entry === true) {
    // Wrong or already used — increment rate counter
    rate.count++;
    await env.OTP_STORE.put(rateKey, JSON.stringify(rate), { expirationTtl: 900 });
    return jsonResponse({ error: entry === true ? 'Password already used.' : 'Invalid password.' }, 401);
  }

  // Valid — mark as used immediately
  pool.passwords[password] = true;
  pool.usedCount = (pool.usedCount || 0) + 1;
  await env.OTP_STORE.put('pool', JSON.stringify(pool));

  const token = await createJWT(env.JWT_SECRET, { role: 'user' }, 30 * 24 * 60 * 60 * 1000); // 30 days
  return jsonResponse({ success: true, token });
}
