import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, ClassAdaptations } from '../types';

const FACILITATION_COUNT_KEY = 'facilitation_counts';

// ─── Auth Slice ───────────────────────────────────────────────────────────────

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setUser: (user: UserProfile | null) => void;
  setInitializing: (initializing: boolean) => void;
  signOut: () => void;
}

// ─── App Slice ────────────────────────────────────────────────────────────────

interface AppState {
  selectedLanguage: string;
  isOffline: boolean;
  notifBadgeCount: number;
  setLanguage: (lang: string) => void;
  setOffline: (offline: boolean) => void;
  setNotifBadgeCount: (count: number) => void;
  clearNotifBadge: () => void;
}

// ─── Facilitation Slice ──────────────────────────────────────────────────────

interface FacilitationState {
  facilitationStep: number;
  facilitationTime: number;
  facilitationTimerRunning: boolean;
  facilitationNotes: Record<number, string>;
  /** ISO time the current run began, so a session records real elapsed time. */
  facilitationStartedAt: string | null;
  facilitationCount: Record<string, number>; // activity_id -> count
  editingNotes: boolean;
  currentNoteEdit: string;
  setFacilitationStep: (step: number) => void;
  setFacilitationTime: (time: number) => void;
  setFacilitationTimerRunning: (running: boolean) => void;
  setFacilitationNote: (stepId: number, note: string) => void;
  startFacilitationRun: () => void;
  setEditingNotes: (editing: boolean) => void;
  setCurrentNoteEdit: (note: string) => void;
  incrementFacilitationCount: (activityId: string) => void;
  loadFacilitationCounts: () => Promise<void>;
  resetFacilitation: () => void;
}

// ─── Combined Store ───────────────────────────────────────────────────────────

type StoreState = AuthState & AppState & FacilitationState;

export const useStore = create<StoreState>((set, get) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isInitializing: false,
    }),

  setInitializing: (isInitializing) => set({ isInitializing }),

  signOut: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),

  // App
  selectedLanguage: 'en',
  isOffline: false,
  notifBadgeCount: 0,

  setLanguage: (selectedLanguage) => set({ selectedLanguage }),
  setOffline: (isOffline) => set({ isOffline }),
  setNotifBadgeCount: (notifBadgeCount) => set({ notifBadgeCount }),
  clearNotifBadge: () => set({ notifBadgeCount: 0 }),

  // Facilitation
  facilitationStep: 0,
  facilitationTime: 0,
  facilitationTimerRunning: false,
  facilitationNotes: {},
  facilitationStartedAt: null,
  facilitationCount: {},
  editingNotes: false,
  currentNoteEdit: '',

  setFacilitationStep: (facilitationStep) => set({ facilitationStep }),
  setFacilitationTime: (facilitationTime) => set({ facilitationTime }),
  setFacilitationTimerRunning: (facilitationTimerRunning) => set({ facilitationTimerRunning }),
  setFacilitationNote: (stepId, note) =>
    set((state) => ({
      facilitationNotes: { ...state.facilitationNotes, [stepId]: note },
    })),
  startFacilitationRun: () => set({ facilitationStartedAt: new Date().toISOString() }),
  setEditingNotes: (editingNotes) => set({ editingNotes }),
  setCurrentNoteEdit: (currentNoteEdit) => set({ currentNoteEdit }),

  incrementFacilitationCount: (activityId) => {
    const newCount = {
      ...get().facilitationCount,
      [activityId]: (get().facilitationCount[activityId] || 0) + 1,
    };
    set({ facilitationCount: newCount });
    // Persist to AsyncStorage
    AsyncStorage.setItem(FACILITATION_COUNT_KEY, JSON.stringify(newCount)).catch(() => {});
  },

  loadFacilitationCounts: async () => {
    try {
      const stored = await AsyncStorage.getItem(FACILITATION_COUNT_KEY);
      if (stored) {
        set({ facilitationCount: JSON.parse(stored) });
      }
    } catch {
      // Ignore parse errors
    }
  },

  resetFacilitation: () =>
    set({
      facilitationStep: 0,
      facilitationTime: 0,
      facilitationTimerRunning: false,
      facilitationNotes: {},
      facilitationStartedAt: null,
      editingNotes: false,
      currentNoteEdit: '',
    }),
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectUser = (state: StoreState) => state.user;
export const selectIsAuthenticated = (state: StoreState) => state.isAuthenticated;
export const selectIsInitializing = (state: StoreState) => state.isInitializing;
export const selectLanguage = (state: StoreState) => state.selectedLanguage;
export const selectIsOffline = (state: StoreState) => state.isOffline;
