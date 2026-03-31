import { verifyJWT, jsonResponse } from '../../_utils/jwt.js';

export async function onRequestGet({ request, env }) {
  const auth = request.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return jsonResponse({ authenticated: false }, 401);

  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload || payload.role !== 'user') return jsonResponse({ authenticated: false }, 401);

  return jsonResponse({ authenticated: true });
}
