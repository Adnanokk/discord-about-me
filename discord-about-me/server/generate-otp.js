/**
 * One-Time Password Generator
 * Run: npm run generate-otp
 *
 * Generates a cryptographically secure random password, hashes it with bcrypt,
 * and saves the hash to otp-store.json. The plaintext password is shown once
 * in the terminal and is NEVER stored.
 */
import bcrypt from 'bcryptjs';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OTP_STORE_PATH = join(__dirname, 'otp-store.json');

// Unambiguous charset — no 0/O, 1/I/l confusion
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
const PASSWORD_LENGTH = 24;

// Rejection sampling for uniform distribution (no modulo bias)
function secureRandomChar() {
  const max = Math.floor(256 / CHARSET.length) * CHARSET.length;
  while (true) {
    const byte = crypto.randomBytes(1)[0];
    if (byte < max) return CHARSET[byte % CHARSET.length];
  }
}

const rawPassword = Array.from({ length: PASSWORD_LENGTH }, secureRandomChar).join('');

// bcrypt with 12 rounds (~300ms on modern hardware — expensive enough to slow brute force)
console.log('[otp] Hashing password (this takes a moment)...');
const hash = await bcrypt.hash(rawPassword, 12);

const store = {
  hash,
  used: false,
  createdAt: Date.now(),
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
};

writeFileSync(OTP_STORE_PATH, JSON.stringify(store, null, 2));

console.log('\n╔══════════════════════════════════════════╗');
console.log('║        ONE-TIME PASSWORD GENERATED       ║');
console.log('╠══════════════════════════════════════════╣');
console.log('║                                          ║');
console.log(`║  ${rawPassword.padEnd(40)} ║`);
console.log('║                                          ║');
console.log('╠══════════════════════════════════════════╣');
console.log('║  • Single use — invalidated after entry  ║');
console.log('║  • Expires in 7 days                     ║');
console.log('║  • Plaintext is NOT stored anywhere      ║');
console.log('╚══════════════════════════════════════════╝\n');
