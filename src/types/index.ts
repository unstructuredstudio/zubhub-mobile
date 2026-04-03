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
  amazon_url?: string;
}

export interface ActivityStep {
  number: number;
  title: string;
  description: string;
  duration_minutes: number;
  tip?: string;
  images?: string[];
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  min_age: number;
  max_age?: number;
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
  tags: string[];
  category?: Category;
}

// ─── Community ───────────────────────────────────────────────────────────────

export interface CommunityNote {
  id: string;
  activity_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  note: string;
  rating?: number;
  images?: string[];
  created_at: string;
}

// ─── Engagement Analytics ────────────────────────────────────────────────────

export type EngagementEventType =
  | 'view'
  | 'download'
  | 'share_whatsapp'
  | 'share_other'
  | 'create_activity'
  | 'add_note';

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

export interface FacilitationSession {
  id: string;
  activity_id: string;
  user_id: string;
  student_count: number;
  started_at: string;
  completed_at?: string;
  notes: Record<number, string>; // step id -> note text
  photos: string[];
  community_note?: string;
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
  AddNote: { activityId: string; activityTitle: string };
  FacilitationSetup: { activity: Activity };
  FacilitationActive: { activity: Activity; studentCount: number; adaptations: ClassAdaptations };
  FacilitationComplete: { activity: Activity; studentCount: number };
};

export type CreateStackParamList = {
  CreateActivity: undefined;
  ReviewActivity: { draft?: DraftActivity; activity?: Activity; aiGenerated?: any };
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
