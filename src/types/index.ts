// ─── User & Auth ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  organization?: string;
  bio?: string;
  avatar_url?: string;
  language_preference: string;
  activities_shared: number;
  activities_used: number;
  created_at: string;
}

// ─── Activity Content ────────────────────────────────────────────────────────

export interface Material {
  name: string;
  price?: string;
  /** Where an educator can realistically source this locally. */
  buy_hint?: string;
  /** Null is written deliberately to clear a previously set link. */
  amazon_url?: string | null;
}

export interface ActivityStep {
  number: number;
  title: string;
  description: string;
  duration_minutes: number;
  tip?: string;
  images?: string[];
}

/**
 * Attribution carried by an activity derived from another.
 *
 * The source's title and author are copied rather than looked up, so the credit
 * still reads correctly if the original is later renamed or deleted.
 */
export interface RemixSource {
  id: string;
  title: string;
  creator_name?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  min_age: number;
  max_age?: number | null;
  group_size_min?: number;
  group_size_max?: number;
  materials: Material[];
  steps: ActivityStep[];
  tips: string[];
  objectives: string[];
  language: string;
  created_by: string;
  creator_name?: string;
  creator_avatar?: string;
  created_at: string;
  updated_at: string;
  featured_image_url?: string;
  thumbnail_url?: string;
  video_url?: string;
  pdf_url?: string;
  is_featured: boolean;
  download_count: number;
  share_count: number;
  view_count: number;
  facilitation_count: number;
  rating: number;
  rating_count: number;
  /** Set when this activity was derived from another. Absent on originals. */
  remixed_from?: RemixSource;
  /** How many activities have been derived from this one. */
  remix_count?: number;
  tags: string[];
  category?: Category;
}

// ─── Community ───────────────────────────────────────────────────────────────

/**
 * A photo of what participants made.
 *
 * Owned by the activity and its uploader, not by a written experience: photos
 * and reflections are captured separately, so deleting one must never take the
 * other with it.
 */
export interface ActivityPhoto {
  id: string;
  activity_id: string;
  user_id: string;
  user_name: string;
  /** The run it came out of, when it was added right after facilitating. */
  session_id?: string;
  url: string;
  caption?: string;
  created_at: string;
}

/** A photo attached to a community note. */
export interface NotePhoto {
  url: string;
  /**
   * Educator-supplied and always optional. Nothing in the capture flow asks for
   * one, so most photos will never have it.
   */
  caption?: string;
}

export interface CommunityNote {
  id: string;
  activity_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  note: string;
  rating?: number;
  /**
   * Notes written before captions existed hold bare URL strings, so both shapes
   * come back from Firestore. Read this through `notePhotos()` rather than
   * touching it directly -- that also drops the dead `file://` URIs that an
   * older upload path let through.
   */
  images?: Array<string | NotePhoto>;
  /**
   * The run this note reflects on. Absent on notes written from an activity
   * page rather than at the end of a facilitation, and on notes predating runs.
   */
  session_id?: string;
  created_at: string;
}

// ─── Engagement Analytics ────────────────────────────────────────────────────

export type EngagementEventType =
  | 'view'
  | 'download'
  | 'share_whatsapp'
  | 'share_other'
  | 'create_activity'
  | 'add_note'
  | 'facilitate'
  | 'remix';

export interface EngagementEvent {
  activity_id?: string;
  event_type: EngagementEventType;
  platform?: string;
  metadata?: Record<string, unknown>;
}

// ─── Facilitation ───────────────────────────────────────────────────────────

export interface FacilitationStep {
  id: number;
  title: string;
  duration: number; // minutes (base, before adaptation)
  phase: string;
  content: string;
  aiTips: string[];
  educatorNotes: string;
  images?: string[];
  tip?: string;
}

/**
 * One run of an activity with a group.
 *
 * A run is recorded whether or not the educator writes anything about it
 * afterwards, so this is the source of truth for "how often has this been
 * facilitated" -- a community note is an optional reflection *on* a run, linked
 * back by its `session_id`.
 */
export interface FacilitationSession {
  id: string;
  activity_id: string;
  user_id: string;
  student_count: number;
  started_at: string;
  completed_at: string;
  /** Notes the educator typed against individual steps during the run. */
  step_notes: Record<number, string>;
}

export interface ClassAdaptations {
  timeMultiplier: number;
  suggestions: string[];
  groupingAdvice: string;
}

// ─── AI Create Flow ──────────────────────────────────────────────────────────

export interface AIMessage {
  role: 'ai' | 'user';
  text: string;
}

export interface DraftActivity {
  description: string;
  timing: string;
  materials: string;
  steps?: string;
  tips: string;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  CreateTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ActivityDetail: { activityId: string; activity?: Activity };
  FacilitationSetup: { activity: Activity };
  FacilitationActive: { activity: Activity; studentCount: number; adaptations: ClassAdaptations };
  FacilitationComplete: { activity: Activity; studentCount: number };
  EducatorProfile: {
    userId: string;
    name?: string;
    organization?: string;
    bio?: string;
  };
};

export type CreateStackParamList = {
  CreateActivity: undefined;
  ReviewActivity: {
    draft?: DraftActivity;
    /** Edit this activity in place. */
    activity?: Activity;
    /** Prefill from this activity and publish a new one crediting it. */
    remixFrom?: Activity;
    aiGenerated?: any;
  };
};

// ─── API Responses ───────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export type Category = 'Art' | 'Science' | 'Coding' | 'Circuits' | 'Engineering' | 'Storytelling' | 'Drama' | 'Film' | 'Music' | 'Nature';

export const CATEGORIES: { id: Category; icon: string; color: string }[] = [
  { id: 'Art',          icon: 'color-palette-outline',  color: '#F472B6' },
  { id: 'Science',      icon: 'flask-outline',           color: '#34D399' },
  { id: 'Coding',       icon: 'code-slash-outline',      color: '#818CF8' },
  { id: 'Circuits',     icon: 'flash-outline',           color: '#FBBF24' },
  { id: 'Engineering',  icon: 'construct-outline',       color: '#60A5FA' },
  { id: 'Storytelling', icon: 'book-outline',            color: '#F97316' },
  { id: 'Drama',        icon: 'happy-outline',           color: '#C084FC' },
  { id: 'Film',         icon: 'film-outline',            color: '#E53E3E' },
  { id: 'Music',        icon: 'musical-notes-outline',   color: '#14B8A6' },
  { id: 'Nature',       icon: 'leaf-outline',            color: '#4ADE80' },
];

// ─── Language ─────────────────────────────────────────────────────────────────

export interface Language {
  code: string;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'zh', label: 'Mandarin', nativeLabel: '中文' },
];
