import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, setDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp,
  increment, DocumentSnapshot, DocumentData, QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { Activity, CommunityNote, UserProfile, PaginatedResponse } from '../types';

// Recursively remove undefined values from an object (Firestore rejects them)
function stripUndefined(obj: any): any {
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    );
  }
  return obj;
}

const IS_DEMO =
  !process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === 'demo-project';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USER: UserProfile = {
  id: 'demo-user-001',
  email: 'demo@zubhub.org',
  full_name: 'Demo Educator',
  organization: 'ZubHub Demo',
  bio: 'Exploring ZubHub in demo mode.',
  language_preference: 'en',
  activities_shared: 3,
  activities_used: 12,
  created_at: new Date().toISOString(),
};

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act-001',
    title: 'Paper Bridge Challenge',
    description: 'Kids design and build bridges using only newspaper and tape, then test how much weight they can hold.',
    duration_minutes: 45,
    min_age: 7,
    max_age: 12,
    materials: [{ name: 'Newspaper' }, { name: 'Masking tape' }, { name: 'Small weights or coins' }],
    steps: [
      { number: 1, title: 'Plan', description: 'Sketch your bridge design.', duration_minutes: 5 },
      { number: 2, title: 'Build', description: 'Construct the bridge using newspaper and tape.', duration_minutes: 25 },
      { number: 3, title: 'Test', description: 'Place weights on the bridge and record how much it holds.', duration_minutes: 10 },
      { number: 4, title: 'Reflect', description: 'Discuss what worked and what could be improved.', duration_minutes: 5 },
    ],
    tips: ['Fold newspaper into tubes for extra strength.', 'Compare results across teams.'],
    objectives: ['Engineering design', 'Teamwork', 'Problem solving'],
    language: 'en',
    created_by: 'demo-user-001',
    creator_name: 'Demo Educator',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    download_count: 128,
    share_count: 45,
    view_count: 340,
    rating: 4.7,
    rating_count: 32,
    tags: ['STEM', 'engineering', 'teamwork'],
  },
  {
    id: 'act-002',
    title: 'Story Dice',
    description: 'Roll picture dice and collaboratively build a creative story — great for language and imagination.',
    duration_minutes: 30,
    min_age: 5,
    max_age: 10,
    materials: [{ name: 'Blank dice or paper cubes' }, { name: 'Markers' }],
    steps: [
      { number: 1, title: 'Draw', description: 'Draw simple pictures on each face of the dice.', duration_minutes: 10 },
      { number: 2, title: 'Roll & tell', description: 'Each child rolls and adds a sentence to the story.', duration_minutes: 20 },
    ],
    tips: ['Encourage shy kids to draw rather than speak first.'],
    objectives: ['Creativity', 'Language skills', 'Listening'],
    language: 'en',
    created_by: 'demo-user-001',
    creator_name: 'Demo Educator',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    download_count: 89,
    share_count: 31,
    view_count: 210,
    rating: 4.5,
    rating_count: 20,
    tags: ['language', 'creativity', 'storytelling'],
  },
  {
    id: 'act-004',
    title: 'Messaging Station',
    description: 'Make a messaging station with objects found around your household! Explore how seemingly complicated verbal and written messages could be transmitted through completely different mediums using simple circuits and secret codes.',
    duration_minutes: 60,
    min_age: 8,
    max_age: 14,
    group_size_min: 2,
    group_size_max: 4,
    materials: [
      { name: 'Cloth clips', buy_hint: 'Any household or stationery shop' },
      { name: 'Aluminium foil', buy_hint: 'Kitchen supplies or grocery store' },
      { name: 'Connecting wires', buy_hint: 'Hardware or electronics store' },
      { name: 'Cardboard', buy_hint: 'Reuse old boxes' },
      { name: 'Light bulbs (small)', buy_hint: 'Electronics store; LEDs or small torch bulbs work' },
      { name: 'Batteries', buy_hint: 'Any general store; AA or D cells' },
      { name: 'Cutter', buy_hint: 'Stationery shop' },
      { name: 'Tape', buy_hint: 'Any stationery shop' },
    ],
    steps: [
      {
        number: 1,
        title: 'Make a Switch',
        description: 'Take a cloth clip and attach aluminum foil to both ends of one side (the side that is normally open). Attach wires to both foil ends. You just made a switch! When you press the clip shut, the foil pieces touch and complete the circuit.',
        duration_minutes: 10,
        tip: 'Have students work in pairs. One holds the clip steady while the other wraps the foil. Make sure foil covers the full contact surface.',
        images: ['image19.jpg', 'image20.jpg'],
      },
      {
        number: 2,
        title: 'Build a Bulb Holder',
        description: 'Cut out a piece of cardboard and attach two different pieces of aluminum foil on the inside and outside, making two terminals. Make a hole on top sized for your bulb. Attach wires to each foil terminal and glue the flap shut. Push your bulb through the hole. The side should touch the top foil and the bottom should touch the bottom foil.',
        duration_minutes: 10,
        tip: 'If bulbs don\'t fit snugly, use a bit of tape to secure them. LEDs work too but the direction of current matters. The (+)ve terminal should connect to the (+)ve terminal of the battery.',
        images: ['image14.jpg', 'image9.jpg'],
      },
      {
        number: 3,
        title: 'Complete the Circuit',
        description: 'Connect a few batteries together so they can glow your bulb brightly. Connect one wire from the bulb holder to one terminal of the battery, and the other terminal of the battery to the switch. Connect the free terminals of the bulb holder and switch together. When you close the switch, the bulb should glow!',
        duration_minutes: 10,
        tip: 'If the bulb doesn\'t glow, check all connections, try a higher voltage battery, or try multiple batteries. Make sure there are no short circuits. If battery terminals are directly connected too long, it will ruin the battery.',
        images: ['image16.jpg', 'image15.jpg'],
      },
      {
        number: 4,
        title: 'Connect Two Stations',
        description: 'Make two such circuit sets. Make sure each has an extra pair of wires connected to the switch terminals. Place the two circuits far from each other, preferably where they are not in sight of each other. Join old pieces of wire to create a long chain and connect the two extra terminals of the bulb holders together. Now when you close the switch, the bulb should glow on both ends!',
        duration_minutes: 15,
        tip: 'Encourage students to place stations in separate rooms or corners. The longer the wire chain, the more exciting the transmission feels! You can use aluminum foil twisted into strips if you run out of wire.',
        images: ['image22.jpg', 'image23.jpg'],
      },
      {
        number: 5,
        title: 'Create Your Secret Language & Transmit!',
        description: 'Use Morse Code where messages are transmitted in dots and dashes. A short blink is a dot, a long blink is a dash. Try transmitting your name to your partner! You can also create your own secret language and share the key with your friends so only they can understand. We even used lights to communicate moods: fast flashing with long blinks for happy, slow flashing with long blinks for sad!',
        duration_minutes: 15,
        tip: 'Print out a Morse Code reference sheet for each pair. Start with short words like "HI" or "HEY" before attempting longer messages. Ask: what other ways could you encode a message?',
        images: ['image6.png', 'morse-dots-dashes.png', 'mood-communication.png'],
      },
    ],
    tips: [
      'Demonstrate the activity with help from a demo video and discuss: What is Morse Code? Where did it originate? How were messages transmitted before telephones and emails?',
      'Ask students: Have they ever seen a rotary landline phone? How do they think landlines work? How did pigeons transmit messages during World War 1 and 2?',
      'Share ideas for alternative materials: aluminum foil and tape to connect multiple batteries, buzzers in place of the light bulb, vibrating motors, or even speakers.',
      'Encourage participants to decorate their messaging station, try connecting stations using long wires, and place them in separate rooms.',
      'Ask participants to share the process of making their station and finally, share the message transmitted!',
    ],
    objectives: [
      'Learn how people communicated before telephones and computers',
      'Learn the patterns of Morse Code to communicate',
      'Learn to make and use simple circuits',
      'Develop communication, problem-solving, and critical-thinking skills',
    ],
    language: 'en',
    created_by: 'unstructured-studio',
    creator_name: 'Unstructured Studio',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    featured_image_url: 'image3.jpg',
    video_url: 'https://www.youtube.com/watch?v=jjjw_9E8MUk',
    is_featured: false,
    download_count: 76,
    share_count: 28,
    view_count: 215,
    facilitation_count: 18,
    rating: 4.6,
    rating_count: 22,
    tags: ['circuits', 'communication', 'morse code', 'STEM', 'hands-on'],
    category: 'Circuits',
  },
  {
    id: 'act-005',
    title: 'Homemade Circuits',
    description: 'Make circuit elements with objects found around your household! Build switches, bulb holders, electromagnets, and light dimmers using everyday materials like cloth clips, aluminum foil, and graphite pencils.',
    duration_minutes: 60,
    min_age: 8,
    max_age: 14,
    group_size_min: 1,
    group_size_max: 4,
    materials: [
      { name: 'Cloth clips', buy_hint: 'Any household or stationery shop' },
      { name: 'Aluminium foil', buy_hint: 'Kitchen supplies or grocery store' },
      { name: 'Connecting wires', buy_hint: 'Hardware or electronics store' },
      { name: 'Cardboard', buy_hint: 'Reuse old boxes' },
      { name: 'Iron nail', buy_hint: 'Hardware store' },
      { name: 'Graphite pencil', buy_hint: 'Any stationery shop' },
      { name: 'Light bulbs (small)', buy_hint: 'Electronics store; LEDs or small torch bulbs work' },
      { name: 'Batteries (9V)', buy_hint: 'Any general store' },
      { name: 'Cutter', buy_hint: 'Stationery shop' },
      { name: 'Tape', buy_hint: 'Any stationery shop' },
    ],
    steps: [
      {
        number: 1,
        title: 'Make a Switch',
        description: 'Take a cloth clip and attach aluminum foil to both ends of one side. Attach wires to both foil ends. You just made a switch! When you press the clip shut, the foil pieces touch and complete the circuit. For a two-way switch, cover one part with foil as a common terminal and two parts of the other end separately.',
        duration_minutes: 10,
        tip: 'Make sure the foil covers the full contact surface so the connection is reliable. Have students work in pairs, one holds the clip while the other wraps the foil.',
        images: ['image6.jpg', 'image7.jpg'],
      },
      {
        number: 2,
        title: 'Build a Bulb Holder',
        description: 'Cut out a piece of cardboard and attach two different pieces of aluminum foil on the inside and outside to make two terminals. Make a hole on top sized for your bulb. Attach wires to each foil terminal and glue the flap shut. Push the bulb through. The side should touch the top foil and the bottom should touch the bottom foil. Connect it to a battery and the bulb should glow!',
        duration_minutes: 10,
        tip: 'If bulbs don\'t fit snugly, use tape to secure them. LEDs work too, but the direction of current matters. The (+)ve terminal of the LED should connect to the (+)ve terminal of the battery.',
        images: ['image10.jpg', 'image2.jpg'],
      },
      {
        number: 3,
        title: 'Light Up Your Circuit',
        description: 'Connect your switch and bulb holder to batteries. Wire one terminal of the bulb holder to the battery, and the other terminal of the battery to the switch. Connect the free terminals together. When you close the switch, the bulb should glow! Try connecting two bulbs in series (one after another) or in parallel (side by side) and observe how brightness changes.',
        duration_minutes: 15,
        tip: 'If the bulb doesn\'t glow, check all connections and try a higher voltage battery. In a series circuit, removing one bulb breaks the whole circuit. In a parallel circuit, each bulb works independently!',
        images: ['image8.jpg', 'image11.jpg'],
      },
      {
        number: 4,
        title: 'Build an Electromagnet',
        description: 'Take a solid copper wire and coil it tightly around an iron nail multiple times. Connect the two ends of the wire to a 9V battery. Try picking up small metal objects. What happens? Now remove the nail, reconnect, and try again. Notice the difference! The iron core makes the magnetic field much stronger.',
        duration_minutes: 15,
        tip: 'Don\'t keep the wire connected to the battery for too long as it will drain and heat up. Count the number of coils, more coils mean a stronger magnet! Try picking up paper clips or staples.',
        images: ['image9.jpg', 'image4.jpg'],
      },
      {
        number: 5,
        title: 'Make a Light Dimmer',
        description: 'Take a graphite pencil and carefully remove the wood to expose the lead. Connect one end of a bulb and battery circuit. Connect the other battery terminal to one side of the pencil. Wrap some foil to the exposed end of the other wire from the bulb. Slide the wire across the exposed graphite lead. Does the brightness of the bulb change? The graphite acts as a variable resistor!',
        duration_minutes: 10,
        tip: 'Mechanical pencil lead also works as a substitute. The closer you slide the wire to the battery connection on the pencil, the brighter the bulb will glow because there is less resistance.',
        images: ['image3.jpg', 'image13.jpg'],
      },
    ],
    tips: [
      'Demonstrate the activity with a demo video and discuss: What are circuits? How does current flow? How would you design a circuit to solve a problem in your day-to-day life?',
      'Share troubleshooting tips: check all connections, try a higher voltage battery, experiment with different bulbs, ensure no short circuits, and remember that LED direction matters.',
      'Share ideas for alternative materials: aluminum foil twisted into strips as wires, buzzers in place of light bulbs, tape to connect multiple batteries, graphite lead from mechanical pencils.',
      'Encourage participants to combine their circuit elements. Can they make a secret lamp with a dimmer and a switch? A series of lights to decorate something?',
    ],
    objectives: [
      'Understand the concept of basic electrical circuits',
      'Develop low-cost and reusable electrical components from household materials',
      'Learn the difference between series and parallel circuits',
      'Explore electromagnetism and variable resistance',
    ],
    language: 'en',
    created_by: 'unstructured-studio',
    creator_name: 'Unstructured Studio',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    featured_image_url: 'image1.jpg',
    video_url: 'https://www.youtube.com/watch?v=UuNQBtIlUs0',
    is_featured: false,
    download_count: 62,
    share_count: 19,
    view_count: 183,
    facilitation_count: 14,
    rating: 4.5,
    rating_count: 18,
    tags: ['circuits', 'electricity', 'electromagnet', 'STEM', 'hands-on'],
    category: 'Circuits',
  },
  {
    id: 'act-003',
    title: 'Nature Scavenger Hunt',
    description: 'An outdoor activity where children find and identify natural objects, building observation skills.',
    duration_minutes: 60,
    min_age: 6,
    max_age: 14,
    materials: [{ name: 'Checklist printout' }, { name: 'Pencil' }, { name: 'Small bag for collecting' }],
    steps: [
      { number: 1, title: 'Introduce', description: 'Go over the checklist and safety rules.', duration_minutes: 5 },
      { number: 2, title: 'Hunt', description: 'Children search for items on the list.', duration_minutes: 40 },
      { number: 3, title: 'Share', description: 'Groups share what they found and discuss.', duration_minutes: 15 },
    ],
    tips: ['Adapt the list for your local environment.'],
    objectives: ['Nature awareness', 'Observation', 'Scientific thinking'],
    language: 'en',
    created_by: 'demo-user-001',
    creator_name: 'Demo Educator',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: false,
    download_count: 54,
    share_count: 18,
    view_count: 145,
    rating: 4.3,
    rating_count: 15,
    tags: ['outdoor', 'science', 'nature'],
  },
];

const PAGE_SIZE = 10;

// Cursor cache for page-based pagination
let _lastPageDoc: QueryDocumentSnapshot<DocumentData> | null = null;
let _lastPageNum = -1;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tsToIso(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

function docToActivity(snap: DocumentSnapshot<DocumentData>): Activity {
  const data = snap.data()!;
  return {
    ...data,
    id: snap.id,
    created_at: tsToIso(data.created_at),
    updated_at: tsToIso(data.updated_at),
  } as Activity;
}

function docToNote(snap: DocumentSnapshot<DocumentData>): CommunityNote {
  const data = snap.data()!;
  return {
    ...data,
    id: snap.id,
    created_at: tsToIso(data.created_at),
  } as CommunityNote;
}

function docToProfile(snap: DocumentSnapshot<DocumentData>): UserProfile {
  const data = snap.data()!;
  return {
    ...data,
    id: snap.id,
    created_at: tsToIso(data.created_at),
  } as UserProfile;
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function fetchActivities(
  page = 0,
  language?: string,
  featuredOnly = false,
): Promise<PaginatedResponse<Activity>> {
  if (IS_DEMO) {
    const filtered = MOCK_ACTIVITIES.filter(a => !featuredOnly || a.is_featured);
    return { data: filtered, count: filtered.length, hasMore: false };
  }

  const ref = collection(db, 'activities');
  const base = featuredOnly
    ? [where('is_featured', '==', true), orderBy('created_at', 'desc')]
    : [where('is_published', '==', true), orderBy('created_at', 'desc')];

  const pagination =
    page > 0 && _lastPageDoc && _lastPageNum === page - 1
      ? [startAfter(_lastPageDoc), limit(PAGE_SIZE)]
      : [limit(PAGE_SIZE)];

  const q = query(ref, ...base, ...pagination);
  const snapshot = await getDocs(q);

  if (snapshot.docs.length > 0) {
    _lastPageDoc = snapshot.docs[snapshot.docs.length - 1];
    _lastPageNum = page;
  }

  let activities = snapshot.docs.map(docToActivity);

  if (language && language !== 'en') {
    activities = activities.filter(a => a.language === language);
  }

  return {
    data: activities,
    count: activities.length,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
}

export async function fetchActivity(id: string): Promise<Activity> {
  if (IS_DEMO) {
    const activity = MOCK_ACTIVITIES.find(a => a.id === id);
    if (!activity) throw new Error('Activity not found');
    return activity;
  }

  const snap = await getDoc(doc(db, 'activities', id));
  if (!snap.exists()) throw new Error('Activity not found');
  return docToActivity(snap);
}

export async function searchActivities(
  queryStr: string,
  language?: string,
): Promise<Activity[]> {
  if (IS_DEMO) {
    return MOCK_ACTIVITIES.filter(
      a =>
        a.title.toLowerCase().includes(queryStr.toLowerCase()) ||
        a.description.toLowerCase().includes(queryStr.toLowerCase()),
    );
  }

  // Firestore doesn't support full-text search natively.
  // Fetch recent activities and filter client-side (fine up to ~1000 activities).
  // TODO: integrate Algolia or Typesense for larger scale.
  const snapshot = await getDocs(
    query(
      collection(db, 'activities'),
      where('is_published', '==', true),
      orderBy('created_at', 'desc'),
      limit(500),
    ),
  );

  const lower = queryStr.toLowerCase();
  let results = snapshot.docs
    .map(docToActivity)
    .filter(
      a =>
        a.title.toLowerCase().includes(lower) ||
        a.description.toLowerCase().includes(lower) ||
        a.tags?.some((t: string) => t.toLowerCase().includes(lower)),
    );

  if (language && language !== 'en') {
    results = results.filter(a => a.language === language);
  }

  return results.slice(0, 20);
}

export async function createActivity(activity: Partial<Activity>): Promise<Activity> {
  if (IS_DEMO) {
    return {
      ...MOCK_ACTIVITIES[0],
      ...activity,
      id: `act-demo-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Activity;
  }

  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to create an activity');

  // Firestore rejects undefined values — strip them recursively before writing
  const cleaned = stripUndefined(activity);

  const docRef = await addDoc(collection(db, 'activities'), {
    ...cleaned,
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

  await updateDoc(doc(db, 'users', user.uid), {
    activities_shared: increment(1),
  });

  return fetchActivity(docRef.id);
}

export async function updateActivity(
  id: string,
  updates: Partial<Activity>,
): Promise<Activity> {
  if (IS_DEMO) {
    const existing = MOCK_ACTIVITIES.find(a => a.id === id) ?? MOCK_ACTIVITIES[0];
    return { ...existing, ...updates, id, updated_at: new Date().toISOString() } as Activity;
  }

  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to update an activity');

  const cleaned = stripUndefined(updates);

  // Ownership is enforced by Firestore security rules
  await updateDoc(doc(db, 'activities', id), {
    ...cleaned,
    updated_at: serverTimestamp(),
  });

  return fetchActivity(id);
}

export async function incrementViewCount(activityId: string): Promise<void> {
  if (IS_DEMO) return;
  await updateDoc(doc(db, 'activities', activityId), { view_count: increment(1) });
}

export async function incrementDownloadCount(activityId: string): Promise<void> {
  if (IS_DEMO) return;
  await updateDoc(doc(db, 'activities', activityId), { download_count: increment(1) });
}

export async function incrementShareCount(activityId: string): Promise<void> {
  if (IS_DEMO) return;
  await updateDoc(doc(db, 'activities', activityId), { share_count: increment(1) });
}

export async function incrementFacilitationCount(activityId: string): Promise<void> {
  if (IS_DEMO) return;
  await updateDoc(doc(db, 'activities', activityId), { facilitation_count: increment(1) });
}

export async function deleteActivity(activityId: string): Promise<void> {
  if (IS_DEMO) return;

  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to delete an activity');

  // Delete associated community notes
  const notesSnap = await getDocs(
    query(collection(db, 'community_notes'), where('activity_id', '==', activityId)),
  );
  await Promise.all(notesSnap.docs.map(d => deleteDoc(d.ref)));

  // Delete the activity document
  await deleteDoc(doc(db, 'activities', activityId));
}

// ─── Community Notes ──────────────────────────────────────────────────────────

export async function fetchCommunityNotes(activityId: string): Promise<CommunityNote[]> {
  if (IS_DEMO) return [];

  const snapshot = await getDocs(
    query(
      collection(db, 'community_notes'),
      where('activity_id', '==', activityId),
    ),
  );

  return snapshot.docs
    .map(docToNote)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);
}

export async function addCommunityNote(
  activityId: string,
  note: string,
  rating?: number,
  images?: string[],
): Promise<CommunityNote> {
  if (IS_DEMO) {
    return {
      id: `note-demo-${Date.now()}`,
      activity_id: activityId,
      user_id: 'demo-user-001',
      user_name: 'Demo Educator',
      note,
      rating,
      images,
      created_at: new Date().toISOString(),
    };
  }

  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to add a note');

  const profile = await fetchUserProfile(user.uid);

  const docRef = await addDoc(collection(db, 'community_notes'), {
    activity_id: activityId,
    user_id: user.uid,
    user_name: profile.full_name,
    user_avatar: profile.avatar_url ?? null,
    note,
    rating: rating ?? null,
    images: images ?? [],
    created_at: serverTimestamp(),
  });

  // Update activity rating
  const notesSnap = await getDocs(
    query(
      collection(db, 'community_notes'),
      where('activity_id', '==', activityId),
    ),
  );
  const ratings = notesSnap.docs
    .map(d => d.data().rating as number)
    .filter(r => r != null && r > 0);
  if (ratings.length > 0) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await updateDoc(doc(db, 'activities', activityId), {
      rating: Math.round(avg * 100) / 100,
      rating_count: ratings.length,
    });
  }

  const snap = await getDoc(docRef);
  return docToNote(snap);
}

export async function deleteCommunityNote(noteId: string, activityId: string): Promise<void> {
  if (IS_DEMO) return;

  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to delete a note');

  // Verify ownership
  const noteSnap = await getDoc(doc(db, 'community_notes', noteId));
  if (!noteSnap.exists()) throw new Error('Note not found');
  if (noteSnap.data().user_id !== user.uid) throw new Error('You can only delete your own notes');

  await deleteDoc(doc(db, 'community_notes', noteId));

  // Recalculate activity rating
  const notesSnap = await getDocs(
    query(collection(db, 'community_notes'), where('activity_id', '==', activityId)),
  );
  const ratings = notesSnap.docs.map(d => d.data().rating as number).filter(r => r != null && r > 0);
  if (ratings.length > 0) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await updateDoc(doc(db, 'activities', activityId), {
      rating: Math.round(avg * 100) / 100,
      rating_count: ratings.length,
    });
  } else {
    await updateDoc(doc(db, 'activities', activityId), { rating: 0, rating_count: 0 });
  }
}

// ─── User Profiles ────────────────────────────────────────────────────────────

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  if (IS_DEMO) return MOCK_USER;

  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) throw new Error('User profile not found');
  return docToProfile(snap);
}

export async function updateUserProfile(
  updates: Partial<UserProfile>,
): Promise<UserProfile> {
  if (IS_DEMO) return { ...MOCK_USER, ...updates };

  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Strip undefined values — Firestore rejects them
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined) cleaned[k] = v;
  }

  await updateDoc(doc(db, 'users', user.uid), cleaned);
  return fetchUserProfile(user.uid);
}

export async function fetchUserActivities(userId: string): Promise<Activity[]> {
  if (IS_DEMO) return MOCK_ACTIVITIES.filter(a => a.created_by === 'demo-user-001');

  const snapshot = await getDocs(
    query(
      collection(db, 'activities'),
      where('created_by', '==', userId),
      orderBy('created_at', 'desc'),
    ),
  );

  return snapshot.docs.map(docToActivity);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<UserProfile> {
  if (IS_DEMO) return { ...MOCK_USER, email };

  const credential = await signInWithEmailAndPassword(auth, email, password);
  return fetchUserProfile(credential.user.uid);
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  organization?: string,
): Promise<void> {
  if (IS_DEMO) return;

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: fullName });

  // Create user profile document
  await setDoc(doc(db, 'users', credential.user.uid), {
    email,
    full_name: fullName,
    organization: organization ?? null,
    language_preference: 'en',
    activities_shared: 0,
    activities_used: 0,
    created_at: serverTimestamp(),
  });
}

export async function signOut(): Promise<void> {
  if (IS_DEMO) return;
  await firebaseSignOut(auth);
}
