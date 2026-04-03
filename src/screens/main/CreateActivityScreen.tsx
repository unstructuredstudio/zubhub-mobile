import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../store/useStore';
import { t } from '../../i18n';
import { generateActivity, resolvePhotoAssignments } from '../../services/ai';
import { pickAndUploadImage } from '../../services/upload';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';

export default function CreateActivityScreen({ navigation }: { navigation: any }) {
  const { selectedLanguage } = useStore();
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]); // Firebase Storage URLs
  const [videoUrl, setVideoUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleAddPhoto = async () => {
    if (photos.length >= 10) return;
    setUploadingPhoto(true);
    try {
      const url = await pickAndUploadImage();
      if (url) {
        setPhotos((prev) => [...prev, url]);
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (description.trim().length < 20) {
      Alert.alert('Need more detail', 'Please describe your activity in at least a few sentences.');
      return;
    }

    setIsGenerating(true);
    try {
      const aiResult = await generateActivity(
        description.trim(),
        photos.length,
        videoUrl.trim() || undefined,
      );

      const { steps, featuredImageUrl } = resolvePhotoAssignments(aiResult, photos);

      navigation.navigate('ReviewActivity', {
        aiGenerated: {
          title: aiResult.title,
          description: aiResult.description,
          duration_minutes: aiResult.duration_minutes,
          min_age: aiResult.min_age,
          max_age: aiResult.max_age,
          category: aiResult.category,
          materials: aiResult.materials,
          objectives: aiResult.objectives,
          steps,
          tips: aiResult.tips ?? [],
          featured_image_url: featuredImageUrl,
          video_url: videoUrl.trim() || aiResult.steps?.[0] ? videoUrl.trim() : undefined,
        },
      });
    } catch (err: any) {
      Alert.alert('Generation Failed', err?.message ?? 'Could not generate activity. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = description.trim().length >= 20 && !isGenerating && !uploadingPhoto;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <LinearGradient colors={['#E53E3E', '#ED64A6']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{t('createWithAI', selectedLanguage)}</Text>
              <Text style={styles.headerSub}>Describe it, we'll structure it</Text>
            </View>
            <View style={styles.aiIcon}>
              <Ionicons name="sparkles" size={16} color="#fff" />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Description */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
            <Text style={styles.cardLabel}>Describe Your Activity</Text>
          </View>
          <TextInput
            style={styles.descriptionInput}
            placeholder="What do participants make, build, or do? Include details like timing, age group, and materials if you can..."
            placeholderTextColor="#A0AEC0"
            multiline
            numberOfLines={6}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
          <Text style={[styles.charHint, description.length < 20 && styles.charHintWarn]}>
            {description.length < 20
              ? `${20 - description.length} more characters needed`
              : `${description.length} characters`
            }
          </Text>
        </View>

        {/* Photos */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="images-outline" size={18} color={Colors.primary} />
            <Text style={styles.cardLabel}>Photos (Optional)</Text>
          </View>
          <Text style={styles.hint}>
            Upload photos of the activity, materials, or finished product. AI will assign them to steps and pick a cover image.
          </Text>

          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
              {photos.map((uri, index) => (
                <View key={index} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImg} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={22} color={Colors.error} />
                  </TouchableOpacity>
                  <View style={styles.photoBadge}>
                    <Text style={styles.photoBadgeText}>{index + 1}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {photos.length < 10 && (
            <TouchableOpacity
              style={styles.addPhotoBtn}
              onPress={handleAddPhoto}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#3182CE" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={20} color="#3182CE" />
                  <Text style={styles.addPhotoBtnText}>
                    {photos.length === 0 ? 'Add Photos' : `Add More (${photos.length}/10)`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Video Link */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="videocam-outline" size={18} color={Colors.primary} />
            <Text style={styles.cardLabel}>Video Link (Optional)</Text>
          </View>
          <TextInput
            style={styles.videoInput}
            placeholder="https://youtube.com/watch?v=..."
            placeholderTextColor="#A0AEC0"
            value={videoUrl}
            onChangeText={setVideoUrl}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={!canGenerate}
          activeOpacity={0.85}
          style={styles.generateWrap}
        >
          <LinearGradient
            colors={canGenerate ? ['#E53E3E', '#ED64A6'] : ['#CBD5E0', '#CBD5E0']}
            style={styles.generateBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.generateText}>Creating your activity...</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={styles.generateText}>Generate Activity</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footerHint}>
          AI will generate title, steps, materials, objectives, and facilitation tips. You can edit everything before publishing.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  headerCenter: { flex: 1, marginHorizontal: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', fontFamily: 'Raleway_800ExtraBold', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  aiIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
  },
  cardLabel: {
    fontSize: 15, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#1A202C',
  },
  descriptionInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    padding: 14, fontSize: 14, color: '#1A202C',
    backgroundColor: '#F7FAFC', minHeight: 140, lineHeight: 21,
  },
  charHint: { fontSize: 11, color: '#718096', textAlign: 'right', marginTop: 6 },
  charHintWarn: { color: Colors.error },
  hint: { fontSize: 13, color: '#718096', lineHeight: 19, marginBottom: 12 },
  photoRow: { marginBottom: 10 },
  photoThumb: { position: 'relative', marginRight: 10 },
  photoImg: { width: 90, height: 90, borderRadius: 10, backgroundColor: '#E2E8F0' },
  photoRemove: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#fff', borderRadius: 12,
  },
  photoBadge: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  photoBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  addPhotoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderWidth: 2, borderStyle: 'dashed',
    borderColor: '#BEE3F8', borderRadius: 12, backgroundColor: '#EBF8FF',
  },
  addPhotoBtnText: {
    fontSize: 14, fontWeight: '600', fontFamily: 'Raleway_600SemiBold', color: '#3182CE',
  },
  videoInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    padding: 14, fontSize: 14, color: '#1A202C',
    backgroundColor: '#F7FAFC',
  },
  generateWrap: { marginTop: 6 },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18, borderRadius: 16,
  },
  generateText: {
    fontSize: 18, fontWeight: '900', fontFamily: 'Raleway_800ExtraBold', color: '#fff',
  },
  footerHint: {
    fontSize: 12, color: '#A0AEC0', textAlign: 'center',
    marginTop: 12, marginHorizontal: 16, lineHeight: 18,
  },
});
