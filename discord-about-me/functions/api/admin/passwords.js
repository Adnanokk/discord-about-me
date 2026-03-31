import { verifyJWT, jsonResponse } from '../../_utils/jwt.js';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const PASSWORD_LENGTH = 16;
const POOL_SIZE = 1000;

function generatePassword() {
  const bytes = new Uint8Array(PASSWORD_LENGTH * 3);
  crypto.getRandomValues(bytes);
  const max = Math.floor(256 / CHARSET.length) * CHARSET.length;
  let result = '';
  let i = 0;
  while (result.length < PASSWORD_LENGTH) {
    if (i >= bytes.length) {
      // Refill if needed (extremely unlikely)
      crypto.getRandomValues(bytes);
      i = 0;
    }
    if (bytes[i] < max) result += CHARSET[bytes[i] % CHARSET.length];
    i++;
  }
  return result;
}

async function requireAdmin(request, env) {
  const auth = request.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

// GET /api/admin/passwords — return unused passwords
export async function onRequestGet({ request, env }) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized.' }, 401);

  const pool = await env.OTP_STORE.get('pool', 'json');
  if (!pool) return jsonResponse({ passwords: [], total: 0, used: 0, remaining: 0 });

  const unused = Object.entries(pool.passwords)
    .filter(([, used]) => !used)
    .map(([pw]) => pw);

  return jsonResponse({
    passwords: unused,
    total: pool.totalCount || POOL_SIZE,
    used: pool.usedCount || 0,
    remaining: unused.length,
  });
}

// POST /api/admin/passwords — regenerate all 1000 passwords
export async function onRequestPost({ request, env }) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized.' }, 401);

  const passwords = {};
  for (let i = 0; i < POOL_SIZE; i++) {
    passwords[generatePassword()] = false; // false = unused
  }

  const pool = {
    passwords,
    totalCount: POOL_SIZE,
    usedCount: 0,
    createdAt: Date.now(),
  };

  await env.OTP_STORE.put('pool', JSON.stringify(pool));
  return jsonResponse({ success: true, generated: POOL_SIZE });
}
