import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

const MAX_WIDTH = 1200;

/**
 * Opens the image library, compresses the pick, uploads to Firebase Storage,
 * and returns the public URL. Returns null if the user cancelled or an error
 * occurred (errors are shown via Alert so the caller doesn't need to handle UI).
 */
export async function pickAndUploadImage(): Promise<string | null> {
  // Permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow photo library access to add images.');
    return null;
  }

  // Pick
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    allowsEditing: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  // Compress — resize to max 1200px wide, JPEG 75% quality
  let uri = result.assets[0].uri;
  try {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_WIDTH } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
    );
    uri = compressed.uri;
  } catch {
    // If compression fails, use the original
  }

  // Upload to Firebase Storage
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const path = `uploads/${filename}`;

  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });

    const url = await getDownloadURL(storageRef);
    return url;
  } catch (err: any) {
    Alert.alert(
      'Upload failed',
      err?.message ?? 'Could not upload image. Check your Firebase Storage bucket.',
    );
    return null;
  }
}
