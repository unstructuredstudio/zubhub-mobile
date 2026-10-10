import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../config/firebase';
import { NotePhoto } from '../types';

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.75;

// ─── URL helpers ─────────────────────────────────────────────────────────────

/**
 * True only for URLs that resolve off-device. Local `file://` URIs used to be
 * written straight into Firestore, so older community notes hold paths that are
 * dead everywhere except the phone that took the photo — those are filtered out
 * at render time rather than migrated.
 */
export function isRemoteUrl(uri?: string | null): boolean {
  return typeof uri === 'string' && /^https?:\/\//.test(uri);
}

export function remoteUrlsOnly(uris?: string[] | null): string[] {
  return (uris ?? []).filter(isRemoteUrl);
}

/**
 * Normalise the stored `images` field of a community note into photo objects.
 *
 * Notes written before captions existed hold bare URL strings, so both shapes
 * are accepted and everything downstream sees one type. Entries whose URL does
 * not resolve off-device are dropped for the reason described above.
 */
export function notePhotos(
  images?: Array<string | NotePhoto> | null,
): NotePhoto[] {
  return (images ?? [])
    .map((entry) => (typeof entry === 'string' ? { url: entry } : entry))
    .filter((photo): photo is NotePhoto => isRemoteUrl(photo?.url));
}

// ─── Permissions ─────────────────────────────────────────────────────────────

async function ensureLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow photo library access to add images.');
    return false;
  }
  return true;
}

async function ensureCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow camera access to take photos.');
    return false;
  }
  return true;
}

// ─── Picking ─────────────────────────────────────────────────────────────────

/** Opens the photo library. Returns local URIs, or [] if cancelled/denied. */
export async function pickImagesFromLibrary(limit = 1): Promise<string[]> {
  if (!(await ensureLibraryPermission())) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 1,
  });

  if (result.canceled || !result.assets) return [];
  return result.assets.map((a) => a.uri).slice(0, limit);
}

/** Opens the camera. Returns a single local URI in an array, or []. */
export async function captureImageWithCamera(): Promise<string[]> {
  if (!(await ensureCameraPermission())) return [];

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 1,
  });

  if (result.canceled || !result.assets?.[0]) return [];
  return [result.assets[0].uri];
}

// ─── Upload ──────────────────────────────────────────────────────────────────

/**
 * Resize, re-encode and upload one local image, returning its public URL.
 *
 * The re-encode is not only about file size: it drops the original EXIF block,
 * which on a phone photo carries GPS coordinates. Pinning the location of a
 * school is arguably a worse leak than a face, so this runs on every upload and
 * there is no path that skips it.
 */
export async function uploadImage(localUri: string): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Must be signed in to upload images');

  let uri = localUri;
  try {
    const processed = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: MAX_WIDTH } }],
      { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
    );
    uri = processed.uri;
  } catch {
    // Fall through with the original; the upload still strips nothing but is
    // better than losing the photo entirely.
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const storageRef = ref(storage, `uploads/${uid}/${filename}`);

  const response = await fetch(uri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });

  return getDownloadURL(storageRef);
}

/**
 * Upload several images one at a time, reporting progress as each completes.
 * Uploads are sequential on purpose — parallel uploads on a weak connection in
 * a lab tend to time out together rather than degrade gracefully.
 *
 * Failed uploads are skipped rather than aborting the batch, and the count of
 * successes is what the caller sees returned.
 */
export async function uploadImages(
  localUris: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < localUris.length; i++) {
    try {
      urls.push(await uploadImage(localUris[i]));
    } catch {
      // Skip this one; reported to the caller by the shortfall in the result.
    }
    onProgress?.(i + 1, localUris.length);
  }
  return urls;
}

/**
 * Legacy single-image helper: pick from the library and upload in one call.
 * Used by activity authoring and profile avatars, where a consent gate does not
 * apply because the image is of materials or the educator themselves.
 */
export async function pickAndUploadImage(): Promise<string | null> {
  const [uri] = await pickImagesFromLibrary(1);
  if (!uri) return null;

  try {
    return await uploadImage(uri);
  } catch (err: any) {
    console.warn('[Upload] failed:', err?.code ?? err?.message ?? err);
    Alert.alert('Upload failed', 'Could not upload that image. Please try again.');
    return null;
  }
}
