import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OTP_STORE_PATH = join(__dirname, 'otp-store.json');

// Generate a random session secret each run — sessions won't survive restarts (fine for a personal site)
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');
const PORT = process.env.AUTH_PORT || 4000;

const app = express();

// Strict security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com", "esm.sh"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdn.tailwindcss.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(express.json({ limit: '1kb' })); // Limit request body size

// HttpOnly session cookie — cannot be accessed by JavaScript
app.use(session({
  secret: SESSION_SECRET,
  name: '__Host-sid', // __Host- prefix enforces Secure + Path=/ + no Domain
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  },
}));

// Rate limiter: max 5 auth attempts per IP per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

function readOtpStore() {
  if (!existsSync(OTP_STORE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(OTP_STORE_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

// --- Routes ---

// Validate a one-time password
app.post('/api/auth/validate', authLimiter, async (req, res) => {
  const { password } = req.body ?? {};

  if (!password || typeof password !== 'string' || password.length > 128) {
    return res.status(400).json({ error: 'Password required.' });
  }

  const store = readOtpStore();

  if (!store) {
    return res.status(401).json({ error: 'No password generated yet. Run: npm run generate-otp' });
  }

  if (store.used) {
    return res.status(401).json({ error: 'Password already used. Generate a new one with: npm run generate-otp' });
  }

  if (Date.now() > store.expiresAt) {
    return res.status(401).json({ error: 'Password expired. Generate a new one with: npm run generate-otp' });
  }

  // Constant-time comparison via bcrypt to prevent timing attacks
  const valid = await bcrypt.compare(password, store.hash);

  if (!valid) {
    return res.status(401).json({ error: 'Invalid password.' });
  }

  // Invalidate immediately — single use
  store.used = true;
  store.usedAt = Date.now();
  writeFileSync(OTP_STORE_PATH, JSON.stringify(store, null, 2));

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Session error.' });
    req.session.authenticated = true;
    req.session.authenticatedAt = Date.now();
    req.session.save((err2) => {
      if (err2) return res.status(500).json({ error: 'Session save error.' });
      return res.json({ success: true });
    });
  });
});

// Check if current session is authenticated
app.get('/api/auth/check', (req, res) => {
  if (req.session?.authenticated) {
    return res.json({ authenticated: true });
  }
  return res.status(401).json({ authenticated: false });
});

// Logout — destroy session
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('__Host-sid', { path: '/' });
    res.json({ success: true });
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[auth] Server listening on http://127.0.0.1:${PORT}`);
});
