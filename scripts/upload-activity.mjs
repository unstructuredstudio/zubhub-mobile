#!/usr/bin/env node
/**
 * Publish an activity from a folder holding activity.json and its images.
 *
 *   node --env-file=.env scripts/upload-activity.mjs <folder> [--dry-run]
 *   node --env-file=.env scripts/upload-activity.mjs <folder> --update <activityId> [--with-images]
 *
 * --update rewrites the text of an activity you already published from this
 * folder, keeping its uploaded images: each step keeps the images it has now,
 * matched by position, so steps must not be added, removed or reordered.
 * Add --with-images when photos changed: every image, the cover included, is
 * uploaded again from the folder, and steps may then change freely.
 *
 * Signs in as a real educator account, so the same Firestore and Storage rules
 * apply as in the app. Image fields in activity.json are filenames inside the
 * folder; each is uploaded once and replaced by its download URL. The cover
 * image is `featured_image` (a filename), or the first step image if absent.
 *
 * Credentials come from ZUBHUB_EMAIL / ZUBHUB_PASSWORD, or are prompted for.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore, collection, addDoc, doc, getDoc, updateDoc, increment, serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MAX_BYTES = 5 * 1024 * 1024; // storage.rules limit
const CONTENT_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const updateIdx = args.indexOf('--update');
const updateId = updateIdx >= 0 ? args[updateIdx + 1] : undefined;
const withImages = args.includes('--with-images');
const folder = args.find((a, i) => !a.startsWith('--') && (updateIdx < 0 || i !== updateIdx + 1));
if (!folder || (updateIdx >= 0 && !updateId)) {
  console.error('Usage: node --env-file=.env scripts/upload-activity.mjs <folder> [--dry-run | --update <activityId> [--with-images]]');
  process.exit(1);
}

const activity = JSON.parse(await readFile(path.join(folder, 'activity.json'), 'utf8'));
const { featured_image: cover, ...fields } = activity;

const stepImages = (fields.steps ?? []).flatMap(s => s.images ?? []);
const coverFile = cover ?? stepImages[0];
const files = [...new Set([...stepImages, ...(coverFile ? [coverFile] : [])])];

// Check everything locally before touching the network, so a typo never
// leaves half an activity's images orphaned in Storage.
const problems = [];
if (!fields.title?.trim()) problems.push('activity.json has no title');
for (const f of files) {
  const p = path.join(folder, f);
  if (!existsSync(p)) problems.push(`missing image: ${f}`);
  else if (!CONTENT_TYPES[path.extname(f).toLowerCase()]) problems.push(`unsupported image type: ${f}`);
  else if ((await readFile(p)).length >= MAX_BYTES) problems.push(`over 5 MB: ${f}`);
}
if (problems.length) {
  problems.forEach(p => console.error(`✗ ${p}`));
  process.exit(1);
}

console.log(`"${fields.title}": ${fields.steps?.length ?? 0} steps, ${files.length} images, cover ${coverFile ?? 'none'}`);
if (dryRun) {
  console.log('Dry run: everything checks out, nothing was uploaded.');
  process.exit(0);
}

function ask(question, hidden = false) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) rl._writeToOutput = s => { if (s.includes(question)) rl.output.write(s); };
  return new Promise(resolve => rl.question(question, a => { rl.close(); if (hidden) console.log(); resolve(a.trim()); }));
}

const env = process.env;
if (!env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
  console.error('Firebase config not found. Run with: node --env-file=.env ...');
  process.exit(1);
}
const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const email = env.ZUBHUB_EMAIL || await ask('ZubHub email: ');
const password = env.ZUBHUB_PASSWORD || await ask('Password: ', true);
const { user } = await signInWithEmailAndPassword(auth, email, password);
console.log(`Signed in as ${user.email}`);

async function uploadAll() {
  const urls = {};
  for (const [i, f] of files.entries()) {
    const ext = path.extname(f).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const storageRef = ref(storage, `uploads/${user.uid}/${name}`);
    await uploadBytes(storageRef, await readFile(path.join(folder, f)), { contentType: CONTENT_TYPES[ext] });
    urls[f] = await getDownloadURL(storageRef);
    console.log(`  [${i + 1}/${files.length}] ${f}`);
  }
  return urls;
}

if (updateId) {
  const snap = await getDoc(doc(db, 'activities', updateId));
  if (!snap.exists()) throw new Error(`No activity ${updateId}`);
  const live = snap.data();
  if (live.created_by !== user.uid) throw new Error('That activity belongs to another account');
  let steps, cover = {};
  if (withImages) {
    const urls = await uploadAll();
    steps = fields.steps.map(st => ({ ...st, images: (st.images ?? []).map(f => urls[f]) }));
    if (coverFile) cover = { featured_image_url: urls[coverFile] };
  } else {
    const liveSteps = live.steps ?? [];
    const mismatch = fields.steps.length !== liveSteps.length
      || fields.steps.some((st, i) => (st.images ?? []).length !== (liveSteps[i].images ?? []).length);
    if (mismatch) throw new Error('Steps or their image counts changed; rerun with --with-images');
    steps = fields.steps.map((st, i) => ({ ...st, images: liveSteps[i].images ?? [] }));
  }
  await updateDoc(doc(db, 'activities', updateId), {
    ...fields,
    max_age: fields.max_age ?? null,
    steps,
    ...cover,
    updated_at: serverTimestamp(),
  });
  console.log(`✓ Updated: activities/${updateId}`);
  process.exit(0);
}

const urls = await uploadAll();

// Mirrors createActivity() in src/services/api.ts.
const docRef = await addDoc(collection(db, 'activities'), {
  ...fields,
  max_age: fields.max_age ?? null,
  steps: fields.steps.map(s => ({ ...s, images: (s.images ?? []).map(f => urls[f]) })),
  ...(coverFile ? { featured_image_url: urls[coverFile] } : {}),
  created_by: user.uid,
  is_published: true,
  download_count: 0,
  share_count: 0,
  view_count: 0,
  facilitation_count: 0,
  rating: 0,
  rating_count: 0,
  created_at: serverTimestamp(),
  updated_at: serverTimestamp(),
});
await updateDoc(doc(db, 'users', user.uid), { activities_shared: increment(1) });

console.log(`✓ Published: activities/${docRef.id}`);
process.exit(0);
