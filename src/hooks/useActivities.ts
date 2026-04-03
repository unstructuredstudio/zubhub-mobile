/**
 * React Query hooks for activity data.
 * Handles caching, pagination, and background refetching
 * in a bandwidth-friendly way.
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchActivities,
  fetchActivity,
  searchActivities,
  fetchCommunityNotes,
  addCommunityNote,
  createActivity,
  incrementViewCount,
} from '../services/api';
import { Activity, CommunityNote } from '../types';
import { trackActivityCreation, trackNoteAdded } from '../services/analytics';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const queryKeys = {
  activities: (language?: string) => ['activities', language] as const,
  activity: (id: string) => ['activity', id] as const,
  search: (query: string, language?: string) => ['search', query, language] as const,
  notes: (activityId: string) => ['notes', activityId] as const,
};

// ─── Activity Feed ────────────────────────────────────────────────────────────

export function useActivitiesFeed(language?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.activities(language),
    queryFn: ({ pageParam = 0 }) => fetchActivities(pageParam as number, language),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length : undefined,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Single Activity ──────────────────────────────────────────────────────────

export function useActivity(id: string, initialData?: Activity) {
  return useQuery({
    queryKey: queryKeys.activity(id),
    queryFn: async () => {
      await incrementViewCount(id);
      return fetchActivity(id);
    },
    initialData,
    staleTime: 2 * 60 * 1000,
    enabled: !!id,
  });
}

// ─── Search ───────────────────────────────────────────────────────────────────

export function useSearch(query: string, language?: string) {
  return useQuery({
    queryKey: queryKeys.search(query, language),
    queryFn: () => searchActivities(query, language),
    enabled: query.trim().length >= 2,
    staleTime: 60 * 1000,
  });
}

// ─── Community Notes ──────────────────────────────────────────────────────────

export function useCommunityNotes(activityId: string) {
  return useQuery({
    queryKey: queryKeys.notes(activityId),
    queryFn: () => fetchCommunityNotes(activityId),
    staleTime: 60 * 1000,
    enabled: !!activityId,
  });
}

export function useAddNote(activityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      note,
      rating,
    }: {
      note: string;
      rating?: number;
    }) => addCommunityNote(activityId, note, rating),

    onSuccess: async (newNote) => {
      // Optimistically update the notes list
      queryClient.setQueryData<CommunityNote[]>(
        queryKeys.notes(activityId),
        (old) => (old ? [newNote, ...old] : [newNote])
      );
      // Invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.notes(activityId) });
      await trackNoteAdded(activityId, newNote.rating !== undefined);
    },
  });
}

// ─── Create Activity ──────────────────────────────────────────────────────────

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activity: Partial<Activity>) => createActivity(activity),
    onSuccess: async (newActivity) => {
      // Invalidate feed so new activity appears
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      await trackActivityCreation(newActivity.id);
    },
  });
}
