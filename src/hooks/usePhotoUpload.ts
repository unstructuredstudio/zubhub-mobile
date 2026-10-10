import { useCallback, useRef, useState } from 'react';
import {
  pickImagesFromLibrary,
  captureImageWithCamera,
  uploadImage,
} from '../services/upload';
import { NotePhoto } from '../types';

export interface PendingPhoto {
  id: string;
  localUri: string;
  /** Set once the upload lands; only these reach Firestore. */
  url?: string;
  /** Optional and never prompted for — see `NotePhoto`. */
  caption?: string;
  status: 'uploading' | 'done' | 'failed';
}

/** Photos an educator may attach to a single note. */
export const MAX_PHOTOS_PER_NOTE = 30;

/**
 * How many uploads may be in flight at once.
 *
 * Firing all of them together is what `uploadImages` in the upload service
 * warns about: on lab wifi a large batch times out as a group rather than
 * degrading, and this screen blocks posting while any photo has failed. A small
 * window still overlaps uploads with typing without that cliff.
 */
const MAX_CONCURRENT_UPLOADS = 3;

let counter = 0;
const nextId = () => `p${Date.now()}_${counter++}`;

/**
 * Pick-and-upload flow shared by every screen that attaches photos to a note.
 *
 * Uploads start the moment a photo is picked rather than on submit, so they
 * overlap with the educator typing their note. On a lab connection that is the
 * difference between a submit that feels instant and one that appears frozen
 * for half a minute.
 */
export function usePhotoUpload(
  options: {
    maxPhotos?: number;
    /**
     * Called as each photo finishes uploading. When supplied, the photo is
     * committed here and then dropped from the staging strip, so picking is the
     * only thing the educator does -- no second button to confirm.
     */
     onUploaded?: (photo: NotePhoto) => Promise<void> | void;
  } = {},
) {
  const { maxPhotos = MAX_PHOTOS_PER_NOTE, onUploaded } = options;

  // Held in a ref so the upload queue never closes over a stale callback.
  const onUploadedRef = useRef(onUploaded);
  onUploadedRef.current = onUploaded;
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [consentVisible, setConsentVisible] = useState(false);

  const queue = useRef<PendingPhoto[]>([]);
  const inFlight = useRef(0);

  const remaining = maxPhotos - photos.length;
  const isUploading = photos.some((p) => p.status === 'uploading');
  const failedCount = photos.filter((p) => p.status === 'failed').length;

  /** Only uploaded photos reach Firestore; a blank caption is left off entirely. */
  const uploadedPhotos: NotePhoto[] = photos
    .filter((p) => p.url)
    .map((p) => {
      const caption = p.caption?.trim();
      return caption ? { url: p.url!, caption } : { url: p.url! };
    });

  /** Drains the queue while keeping at most MAX_CONCURRENT_UPLOADS in flight. */
  const pump = useCallback(() => {
    while (inFlight.current < MAX_CONCURRENT_UPLOADS && queue.current.length > 0) {
      const entry = queue.current.shift()!;
      inFlight.current += 1;

      uploadImage(entry.localUri)
        .then(async (url) => {
          setPhotos((prev) =>
            prev.map((p) => (p.id === entry.id ? { ...p, url, status: 'done' } : p)),
          );

          const commit = onUploadedRef.current;
          if (!commit) return;

          // Committing can fail on its own (denied rules, offline). Treat that
          // like a failed upload so the retry affordance still applies.
          try {
            await commit({ url });
            setPhotos((prev) => prev.filter((p) => p.id !== entry.id));
          } catch {
            setPhotos((prev) =>
              prev.map((p) => (p.id === entry.id ? { ...p, status: 'failed' } : p)),
            );
          }
        })
        .catch(() => {
          setPhotos((prev) =>
            prev.map((p) => (p.id === entry.id ? { ...p, status: 'failed' } : p)),
          );
        })
        .finally(() => {
          inFlight.current -= 1;
          pump();
        });
    }
  }, []);

  const enqueue = useCallback(
    (entries: PendingPhoto[]) => {
      queue.current.push(...entries);
      pump();
    },
    [pump],
  );

  const openPicker = useCallback(() => setConsentVisible(true), []);
  const cancelConsent = useCallback(() => setConsentVisible(false), []);

  const handleConsent = useCallback(
    async (source: 'camera' | 'library') => {
      setConsentVisible(false);
      const uris =
        source === 'camera'
          ? await captureImageWithCamera()
          : await pickImagesFromLibrary(remaining);
      if (uris.length === 0) return;

      const entries: PendingPhoto[] = uris
        .slice(0, remaining)
        .map((localUri) => ({ id: nextId(), localUri, status: 'uploading' }));

      setPhotos((prev) => [...prev, ...entries]);
      enqueue(entries);
    },
    [remaining, enqueue],
  );

  const retryPhoto = useCallback(
    (id: string) => {
      const target = photos.find((p) => p.id === id);
      if (!target) return;
      // Enqueued outside the state updater: React may run an updater twice, and
      // that would queue the same upload two times over.
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'uploading' } : p)),
      );
      enqueue([{ ...target, status: 'uploading' }]);
    },
    [photos, enqueue],
  );

  const removePhoto = useCallback((id: string) => {
    queue.current = queue.current.filter((p) => p.id !== id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setCaption = useCallback((id: string, caption: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, caption } : p)));
  }, []);

  const reset = useCallback(() => {
    queue.current = [];
    setPhotos([]);
  }, []);

  return {
    photos,
    uploadedPhotos,
    isUploading,
    failedCount,
    maxPhotos,
    canAddMore: remaining > 0,
    consentVisible,
    openPicker,
    cancelConsent,
    handleConsent,
    retryPhoto,
    removePhoto,
    setCaption,
    reset,
  };
}
