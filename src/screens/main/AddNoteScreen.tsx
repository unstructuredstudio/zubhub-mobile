import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { addCommunityNote } from '../../services/api';
import { trackNoteAdded } from '../../services/analytics';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';

export default function AddNoteScreen({ route, navigation }: { route: any; navigation: any }) {
  const { activityId, activityTitle } = route.params ?? {};
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - photos.length,
    });
    if (!result.canceled && result.assets) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (note.trim().length < 10) {
      Alert.alert('Too short', 'Please write at least 10 characters about your experience.');
      return;
    }

    setLoading(true);
    try {
      await addCommunityNote(activityId, note.trim(), rating > 0 ? rating : undefined, photos.length > 0 ? photos : undefined);
      await trackNoteAdded(activityId, rating > 0);
      Alert.alert(
        'Thank you!',
        'Your experience has been shared with the community.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not save note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Your Experience</Text>
          <Text style={styles.headerSub}>{activityTitle}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* Star Rating */}
          <Text style={styles.label}>How did it go?</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setRating(s)} activeOpacity={0.7}>
                <Ionicons
                  name={s <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={s <= rating ? '#F6AD55' : '#CBD5E0'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {['', 'Needs work', 'OK', 'Good', 'Great!', 'Excellent!'][rating]}
            </Text>
          )}

          {/* Note */}
          <Text style={[styles.label, { marginTop: 16 }]}>Your Experience *</Text>
          <TextInput
            style={styles.textarea}
            placeholder="What happened? What worked well? What would you change?"
            placeholderTextColor="#A0AEC0"
            multiline
            numberOfLines={5}
            value={note}
            onChangeText={setNote}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, note.length < 10 && styles.charCountWarn]}>
            {note.length} / 10 min
          </Text>

          {/* Photo Upload */}
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
              {photos.map((uri, index) => (
                <View key={index} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImg} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {photos.length < 5 && (
            <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto}>
              <Ionicons name="camera-outline" size={18} color="#3182CE" />
              <Text style={styles.photoBtnText}>
                {photos.length === 0 ? 'Add Photos (Optional)' : `Add More (${photos.length}/5)`}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={{ marginTop: 20 }}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              style={styles.submitBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="send-outline" size={16} color="#fff" />
                  <Text style={styles.submitText}>Publish Note</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  back: { marginBottom: 12, marginTop: 8 },
  headerTitle: { fontSize: 22, fontWeight: '900', fontFamily: 'Raleway_800ExtraBold', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  body: { flex: 1 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, margin: 16, marginTop: -16,
    padding: 20,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8,
    marginBottom: 32,
  },
  label: { fontSize: 14, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#4A5568', marginBottom: 10 },
  stars: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  ratingLabel: { fontSize: 13, color: Colors.primary, fontWeight: '600', fontFamily: 'Raleway_600SemiBold', marginTop: 4 },
  textarea: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    padding: 14, fontSize: 14, color: '#1A202C',
    backgroundColor: '#F7FAFC', minHeight: 120,
  },
  charCount: { fontSize: 11, color: '#718096', textAlign: 'right', marginTop: 4 },
  charCountWarn: { color: Colors.error },
  photoRow: { marginTop: 12, marginBottom: 4 },
  photoThumb: { position: 'relative', marginRight: 8 },
  photoImg: {
    width: 80, height: 80, borderRadius: 8, backgroundColor: '#E2E8F0',
  },
  photoRemove: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#fff', borderRadius: 10,
  },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, marginTop: 8,
    backgroundColor: '#EBF8FF', borderRadius: BorderRadius.sm,
  },
  photoBtnText: {
    fontSize: FontSize.sm, fontWeight: '600',
    fontFamily: 'Raleway_600SemiBold', color: '#3182CE',
  },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: 'Raleway_700Bold' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  cancelText: { fontSize: 14, color: '#718096', fontWeight: '600', fontFamily: 'Raleway_600SemiBold' },
});
