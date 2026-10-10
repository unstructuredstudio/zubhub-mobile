#!/usr/bin/env node
/**
 * Refuses to build a distributable app while a real secret is embedded in it.
 *
 * Every EXPO_PUBLIC_* variable is inlined into the JS bundle at build time, so
 * anything set here is readable by anyone who installs the app -- `strings` on
 * the bundle is enough. That is fine for identifiers (a Firebase web key is
 * protected by security rules, not by being hidden) and fatal for bearer
 * credentials like an Anthropic API key, which carries unlimited spend against
 * the account that owns it.
 *
 *   node scripts/check-secrets.js                  # fails if a secret is found
 *   node scripts/check-secrets.js --allow-internal # warns instead, for builds
 *                                                  # going only to people you
 *                                                  # already trust with the key
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env');
const allowInternal = process.argv.includes('--allow-internal');

/**
 * Variables that are *meant* to be public. A Firebase web API key identifies
 * the project; it is not a credential, and Google documents it as shippable.
 */
const PUBLIC_BY_DESIGN = new Set([
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_SUGGEST_API_URL',
]);

/** Prefixes that are unambiguously bearer credentials. */
const SECRET_PATTERNS = [
  { re: /^sk-ant-/, what: 'Anthropic API key' },
  { re: /^sk-/, what: 'OpenAI-style secret key' },
  { re: /^ghp_|^github_pat_/, what: 'GitHub token' },
  { re: /^xox[baprs]-/, what: 'Slack token' },
  { re: /^AKIA[0-9A-Z]{16}$/, what: 'AWS access key id' },
];

function readEnv(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=');
      return { key: line.slice(0, i).trim(), value: line.slice(i + 1).trim() };
    });
}

const findings = [];
for (const { key, value } of readEnv(ENV_FILE)) {
  if (!key.startsWith('EXPO_PUBLIC_')) continue; // not inlined, not our problem
  if (PUBLIC_BY_DESIGN.has(key)) continue;
  if (!value) continue;

  const match = SECRET_PATTERNS.find((p) => p.re.test(value));
  if (match) findings.push({ key, what: match.what });
}

if (findings.length === 0) {
  console.log('✓ No bearer credentials are embedded in the bundle.');
  process.exit(0);
}

const bar = '─'.repeat(68);
console.error(`\n${bar}`);
console.error(allowInternal ? 'WARNING: secrets will ship in this build' : 'BUILD BLOCKED: secrets would ship in this build');
console.error(bar);
for (const f of findings) {
  console.error(`  ${f.key}  ->  ${f.what}`);
}
console.error(`
Note: this reads .env, which is what a LOCAL build inlines. EAS Build does not
see .env -- it injects the variables stored on the EAS project, so check those
too:  eas env:list preview

Anything set as EXPO_PUBLIC_* is inlined into the JS bundle. Anyone who
installs the app can read it straight out of the binary, and an API key
read out of the binary can be spent against your account without limit.

To fix properly: move the call server-side and point the app at your own
endpoint. src/config/ai.ts already exposes 'baseUrl' for exactly this.

Interim, if this build goes only to people you already trust with the key:
  - set a spend limit at console.anthropic.com
  - rebuild with:  npm run build:apk
  - rotate the key once testing is done
`);

if (allowInternal) {
  console.error('Proceeding because --allow-internal was passed.\n');
  process.exit(0);
}
console.error('Refusing to build. Use --allow-internal for a trusted internal build.\n');
process.exit(1);
