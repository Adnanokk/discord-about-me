/**
 * Portfolio setup script
 * Run: node scripts/setup.js
 *
 * Generates the ADMIN_HASH and JWT_SECRET values you need to add
 * to Cloudflare Pages environment variables.
 */
import crypto from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

console.log('\n╔══════════════════════════════════════════╗');
console.log('║        PORTFOLIO SETUP ASSISTANT         ║');
console.log('╚══════════════════════════════════════════╝\n');

const masterPassword = await ask('Choose your master password (for the admin panel): ');
if (!masterPassword.trim()) { console.error('Password cannot be empty.'); process.exit(1); }

rl.close();

const adminHash = crypto.createHash('sha256').update(masterPassword).digest('hex');
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('\n✓ Done! Add these 3 things in Cloudflare:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n1. ENVIRONMENT VARIABLES');
console.log('   Go to: Pages project → Settings → Environment variables\n');
console.log(`   ADMIN_HASH  =  ${adminHash}`);
console.log(`   JWT_SECRET  =  ${jwtSecret}`);
console.log('\n2. KV NAMESPACE');
console.log('   Go to: Workers & Pages → KV → Create namespace');
console.log('   Name it: OTP_STORE');
console.log('\n3. BIND KV TO YOUR PAGES PROJECT');
console.log('   Go to: Pages project → Settings → Functions → KV namespace bindings');
console.log('   Variable name:  OTP_STORE');
console.log('   KV namespace:   OTP_STORE  (the one you just created)');
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\nAfter setup:');
console.log('  • Deploy your site');
console.log('  • Long-press the footer on your site to open the admin panel');
console.log('  • Enter your master password');
console.log('  • Click "GENERATE 1000 PASSWORDS"');
console.log('  • Done! Pick any password to access the site.\n');
