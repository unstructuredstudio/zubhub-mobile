import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';
import { useStore } from '../../store/useStore';
import { addCommunityNote, incrementFacilitationCount as incrementFacilitationCountAPI } from '../../services/api';
import { trackNoteAdded } from '../../services/analytics';

export default function FacilitationCompleteScreen({ route, navigation }: { route: any; navigation: any }) {
  const { activity, studentCount } = route.params;
  const [communityNote, setCommunityNote] = useState('');
  const [noteRating, setNoteRating] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { incrementFacilitationCount, facilitationCount } = useStore();

  const handleMarkFacilitated = async () => {
    incrementFacilitationCount(activity.id);
    // Also persist to Firestore
    try {
      await incrementFacilitationCountAPI(activity.id);
    } catch {
      // Local count is still updated even if Firestore fails
    }
    Alert.alert(
      'Marked as Facilitated!',
      'This will show in your profile and on the activity page.',
    );
  };

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

  const handlePostNote = async () => {
    if (communityNote.trim().length < 10) {
      Alert.alert('Too short', 'Please write at least 10 characters about your experience.');
      return;
    }
    setLoading(true);
    try {
      await addCommunityNote(
        activity.id,
        communityNote.trim(),
        noteRating > 0 ? noteRating : undefined,
        photos.length > 0 ? photos : undefined,
      );
      await trackNoteAdded(activity.id, noteRating > 0);
      Alert.alert(
        'Note Posted!',
        'Other educators can now see your reflections and tips.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ActivityDetail', { activityId: activity.id, activity }),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not save note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.navigate('ActivityDetail', { activityId: activity.id, activity });
  };

  const myCount = facilitationCount[activity.id] || 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Success Icon */}
        <View style={styles.successSection}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Activity Complete!</Text>
          <Text style={styles.successSubtitle}>
            <Text style={{ fontWeight: '700' }}>{activity.title}</Text>
          </Text>
          {myCount > 0 && (
            <View style={styles.countBadge}>
              <Ionicons name="ribbon-outline" size={14} color={Colors.primary} />
              <Text style={styles.facilCountText}>
                Facilitated {myCount} time{myCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Mark as Facilitated */}
        <TouchableOpacity
          onPress={handleMarkFacilitated}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            style={styles.markButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.markButtonText}>Mark as Facilitated</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Share Your Experience - same design as inline note form */}
        <View style={styles.noteSection}>
          <View style={styles.noteHeader}>
            <Ionicons name="chatbubble-outline" size={18} color="#3182CE" />
            <Text style={styles.noteTitle}>Share Your Experience</Text>
          </View>

          <Text style={styles.noteLabel}>How did it go?</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setNoteRating(s)} activeOpacity={0.7}>
                <Ionicons
                  name={s <= noteRating ? 'star' : 'star-outline'}
                  size={28}
                  color={s <= noteRating ? '#F6AD55' : '#CBD5E0'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.noteInput}
            value={communityNote}
            onChangeText={setCommunityNote}
            placeholder="What happened? What worked well? What would you change?"
            placeholderTextColor="#A0AEC0"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, communityNote.length < 10 && styles.charCountWarn]}>
            {communityNote.length} / 10 min
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
          {photos.length === 0 && (
            <Text style={styles.photoPromptText}>Share photos of what participants made!</Text>
          )}

          <TouchableOpacity
            style={styles.postButton}
            onPress={handlePostNote}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              style={styles.postButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={16} color="#fff" />
                  <Text style={styles.postButtonText}>Publish Note</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Skip */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, gap: Spacing.lg },
  successSection: { alignItems: 'center', paddingTop: 32 },
  successCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F0FFF4', alignItems: 'center',
    justifyContent: 'center', marginBottom: Spacing.base,
  },
  successTitle: {
    fontSize: FontSize['2xl'], fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: Colors.textPrimary, marginBottom: Spacing.xs,
  },
  successSubtitle: {
    fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center',
  },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF5F5', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: BorderRadius.full, marginTop: Spacing.sm,
  },
  facilCountText: {
    fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600',
    fontFamily: 'Raleway_600SemiBold',
  },
  markButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: BorderRadius.lg,
  },
  markButtonText: {
    fontSize: FontSize.base, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: '#fff',
  },
  noteSection: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: BorderRadius.lg, padding: Spacing.base, gap: Spacing.md,
  },
  noteHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  noteTitle: {
    fontSize: FontSize.base, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: '#1E40AF',
  },
  noteLabel: {
    fontSize: 14, fontWeight: '700', fontFamily: 'Raleway_700Bold',
    color: '#4A5568',
  },
  stars: { flexDirection: 'row', gap: 6 },
  noteInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    padding: 14, fontSize: 14, color: '#1A202C',
    backgroundColor: '#F7FAFC', minHeight: 100,
  },
  charCount: { fontSize: 11, color: '#718096', textAlign: 'right', marginTop: 4 },
  charCountWarn: { color: Colors.error },
  photoRow: { marginVertical: 4 },
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
    gap: 6, paddingVertical: 10, backgroundColor: '#EBF8FF',
    borderRadius: 8,
  },
  photoBtnText: {
    fontSize: FontSize.sm, fontWeight: '600',
    fontFamily: 'Raleway_600SemiBold', color: '#3182CE',
  },
  photoPromptText: { fontSize: 12, color: '#3182CE' },
  postButton: { borderRadius: 14, overflow: 'hidden' },
  postButtonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14,
  },
  postButtonText: {
    fontSize: FontSize.base, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: '#fff',
  },
  skipButton: {
    paddingVertical: 12, alignItems: 'center',
  },
  skipButtonText: {
    fontSize: FontSize.base, fontWeight: '600',
    fontFamily: 'Raleway_600SemiBold', color: Colors.textMuted,
  },
});
