import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Image, FlatList, Dimensions, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';
import { useStore } from '../../store/useStore';
import { buildFacilitationSteps, formatTime, calculateAdaptations } from '../../services/facilitation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - Spacing.base * 2 - 24; // full width minus padding

export default function FacilitationActiveScreen({ route, navigation }: { route: any; navigation: any }) {
  const { activity, studentCount, adaptations } = route.params;
  const steps = buildFacilitationSteps(activity);

  const {
    facilitationStep, facilitationTime, facilitationTimerRunning,
    facilitationNotes, editingNotes, currentNoteEdit,
    setFacilitationStep, setFacilitationTime, setFacilitationTimerRunning,
    setFacilitationNote, setEditingNotes, setCurrentNoteEdit,
  } = useStore();

  const currentStep = steps[facilitationStep];

  // Image lightbox & carousel
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (facilitationTimerRunning && facilitationTime > 0) {
      const timer = setInterval(() => {
        setFacilitationTime(Math.max(0, useStore.getState().facilitationTime - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [facilitationTimerRunning, facilitationTime]);

  const handleExit = () => {
    Alert.alert(
      'Exit Facilitation',
      'Exit facilitation mode? Your notes will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          onPress: () => {
            setFacilitationTimerRunning(false);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleReset = () => {
    const resetTime = Math.round(currentStep.duration * adaptations.timeMultiplier * 60);
    setFacilitationTime(resetTime);
    setFacilitationTimerRunning(false);
  };

  const goToStep = (stepIndex: number) => {
    const step = steps[stepIndex];
    const newTime = Math.round(step.duration * adaptations.timeMultiplier * 60);
    setFacilitationStep(stepIndex);
    setFacilitationTime(newTime);
    setFacilitationTimerRunning(false);
    setEditingNotes(false);
    setCarouselIndex(0);
  };

  const handleNext = () => {
    if (facilitationStep === steps.length - 1) {
      setFacilitationTimerRunning(false);
      navigation.replace('FacilitationComplete', { activity, studentCount });
    } else {
      goToStep(facilitationStep + 1);
    }
  };

  const handlePrevious = () => {
    if (facilitationStep > 0) {
      goToStep(facilitationStep - 1);
    }
  };

  const handleSaveNote = () => {
    setFacilitationNote(currentStep.id, currentNoteEdit);
    setEditingNotes(false);
  };

  const handleEditNote = () => {
    setEditingNotes(true);
    setCurrentNoteEdit(
      facilitationNotes[currentStep.id] || currentStep.educatorNotes || ''
    );
  };

  if (!currentStep) return null;

  const progress = ((facilitationStep + 1) / steps.length) * 100;
  const stepImages = currentStep.images ?? [];
  const tips = currentStep?.aiTips ?? [];

  return (
    <View style={styles.container}>
      {/* Image Lightbox */}
      <Modal visible={lightboxVisible} transparent animationType="fade" onRequestClose={() => setLightboxVisible(false)}>
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightboxVisible(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {stepImages.length === 1 ? (
            <Image source={{ uri: stepImages[0] }} style={styles.lightboxImage} resizeMode="contain" />
          ) : (
            <FlatList
              data={stepImages}
              horizontal
              pagingEnabled
              initialScrollIndex={lightboxIndex}
              getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.lightboxImage} resizeMode="contain" />
              )}
            />
          )}
        </View>
      </Modal>

      {/* Header */}
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={handleExit}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerStep}>
              Step {facilitationStep + 1} of {steps.length}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step Card */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{currentStep.id}</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>{currentStep.title}</Text>
              <View style={styles.stepMeta}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.stepTime}>
                  {Math.round(currentStep.duration * adaptations.timeMultiplier)} min
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.stepDesc}>{currentStep.content}</Text>

          {/* Step Images - full width, carousel for multiple */}
          {stepImages.length > 0 && (
            <View style={styles.stepImageContainer}>
              {stepImages.length === 1 ? (
                <TouchableOpacity
                  onPress={() => { setLightboxIndex(0); setLightboxVisible(true); }}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: stepImages[0] }} style={styles.stepImageFull} resizeMode="cover" />
                </TouchableOpacity>
              ) : (
                <>
                  <FlatList
                    data={stepImages}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, i) => i.toString()}
                    onMomentumScrollEnd={(e) => {
                      const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - Spacing.base * 2 - 24));
                      setCarouselIndex(idx);
                    }}
                    renderItem={({ item, index }) => (
                      <TouchableOpacity
                        onPress={() => { setLightboxIndex(index); setLightboxVisible(true); }}
                        activeOpacity={0.85}
                      >
                        <Image source={{ uri: item }} style={styles.stepImageCarousel} resizeMode="cover" />
                      </TouchableOpacity>
                    )}
                  />
                  <View style={styles.carouselIndicators}>
                    {stepImages.map((_: string, i: number) => (
                      <View
                        key={i}
                        style={[
                          styles.carouselDot,
                          i === carouselIndex && styles.carouselDotActive,
                        ]}
                      />
                    ))}
                    <Text style={styles.carouselCount}>
                      {carouselIndex + 1} / {stepImages.length}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* Timer Card */}
        <View style={styles.timerCard}>
          <View style={styles.timerRow}>
            <Ionicons name="timer-outline" size={22} color={Colors.primary} />
            <Text style={[
              styles.timerDisplay,
              facilitationTime === 0 && styles.timerExpired,
            ]}>
              {formatTime(facilitationTime)}
            </Text>
            <View style={styles.timerButtons}>
              <TouchableOpacity
                style={styles.timerPlayBtn}
                onPress={() => setFacilitationTimerRunning(!facilitationTimerRunning)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={facilitationTimerRunning ? 'pause' : 'play'}
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.timerResetBtn} onPress={handleReset}>
                <Ionicons name="refresh" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          {facilitationTime === 0 && (
            <View style={styles.timesUpRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.timesUpText}>Ready for the next step</Text>
            </View>
          )}
        </View>

        {/* Facilitation Tips - read-only */}
        {tips.length > 0 && (
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="sparkles" size={18} color="#B7791F" />
              <Text style={styles.tipsTitle}>Facilitation Tips</Text>
            </View>
            {tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipTouchable}>
                  <Ionicons name="chevron-forward" size={14} color="#D69E2E" style={{ marginTop: 2 }} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Educator Notes */}
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <View style={styles.notesHeaderLeft}>
              <Ionicons name="document-text-outline" size={18} color="#3182CE" />
              <Text style={styles.notesTitle}>My Notes</Text>
            </View>
            {!editingNotes && (
              <TouchableOpacity onPress={handleEditNote} style={styles.editBtn}>
                <Ionicons name="create-outline" size={16} color="#3182CE" />
              </TouchableOpacity>
            )}
          </View>
          {editingNotes ? (
            <View style={styles.notesEditArea}>
              <TextInput
                style={styles.notesInput}
                value={currentNoteEdit}
                onChangeText={setCurrentNoteEdit}
                multiline
                numberOfLines={3}
                placeholder="Add your notes for this step..."
                placeholderTextColor={Colors.textMuted}
              />
              <View style={styles.notesEditButtons}>
                <TouchableOpacity style={styles.saveNoteBtn} onPress={handleSaveNote}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.saveNoteBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelNoteBtn}
                  onPress={() => setEditingNotes(false)}
                >
                  <Text style={styles.cancelNoteBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.notesBody}>
              {facilitationNotes[currentStep.id] || currentStep.educatorNotes || 'Tap to add notes...'}
            </Text>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navBtn, styles.prevBtn, facilitationStep === 0 && styles.navBtnDisabled]}
          onPress={handlePrevious}
          disabled={facilitationStep === 0}
        >
          <Ionicons name="chevron-back" size={20} color={facilitationStep === 0 ? Colors.textMuted : Colors.textSecondary} />
          <Text style={[styles.navBtnText, facilitationStep === 0 && styles.navBtnTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtnWrap} onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            style={styles.navBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextBtnText}>
              {facilitationStep === steps.length - 1 ? 'Complete' : 'Next'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerNav: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 8, marginBottom: 12,
  },
  headerStep: {
    fontSize: FontSize.base, fontWeight: '600',
    fontFamily: 'Raleway_600SemiBold', color: '#fff',
  },
  progressBar: {
    width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: 6, backgroundColor: '#fff', borderRadius: 3,
  },
  content: { flex: 1, paddingHorizontal: Spacing.base, paddingTop: Spacing.base },

  // Step card
  stepCard: {
    backgroundColor: '#F7FAFC', borderRadius: 12, padding: 12, marginBottom: Spacing.md,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  stepNum: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: '#fff', fontSize: 14, fontWeight: '700', fontFamily: 'Raleway_700Bold' },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: Colors.textPrimary },
  stepMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  stepTime: { fontSize: 12, color: Colors.textMuted },
  stepDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  tipCallout: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    backgroundColor: '#FFFBEB', borderLeftWidth: 3, borderLeftColor: '#F6AD55',
    padding: 8, borderRadius: 4, marginTop: 8,
  },
  tipCalloutText: { fontSize: 12, color: '#744210', flex: 1 },

  // Step images - full width
  stepImageContainer: { marginTop: 12, borderRadius: 10, overflow: 'hidden' },
  stepImageFull: {
    width: '100%', height: 220, borderRadius: 10, backgroundColor: '#E2E8F0',
  },
  stepImageCarousel: {
    width: SCREEN_WIDTH - Spacing.base * 2 - 24,
    height: 220, borderRadius: 10, backgroundColor: '#E2E8F0',
    marginRight: 8,
  },

  // Carousel indicators
  carouselIndicators: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 10,
  },
  carouselDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E0',
  },
  carouselDotActive: {
    backgroundColor: Colors.primary, width: 10, height: 10, borderRadius: 5,
  },
  carouselCount: {
    fontSize: 12, color: Colors.textMuted, marginLeft: 8,
    fontFamily: 'Raleway_600SemiBold', fontWeight: '600',
  },

  // Timer
  timerCard: {
    backgroundColor: '#FFF5F5', borderWidth: 1.5, borderColor: '#FED7D7',
    borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md,
  },
  timerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  timerDisplay: {
    flex: 1, fontSize: 28, fontWeight: '900',
    fontFamily: 'Raleway_800ExtraBold', color: Colors.primary,
  },
  timerExpired: { color: Colors.textMuted },
  timerButtons: { flexDirection: 'row', gap: 8 },
  timerPlayBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  timerResetBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#FED7D7',
    alignItems: 'center', justifyContent: 'center',
  },
  timesUpRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
  },
  timesUpText: {
    fontSize: FontSize.sm, fontWeight: '600',
    fontFamily: 'Raleway_600SemiBold', color: Colors.success,
  },

  // Tips - editable
  tipsCard: {
    backgroundColor: '#FFFBEB', borderWidth: 1.5, borderColor: '#FDE68A',
    borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md,
  },
  tipsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8,
  },
  tipsTitle: {
    fontSize: FontSize.base, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: '#92400E',
  },
  tipRow: {
    marginBottom: 6,
  },
  tipTouchable: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
  },
  tipText: { fontSize: FontSize.sm, color: '#92400E', flex: 1, lineHeight: 18 },
  // Notes
  notesCard: {
    backgroundColor: '#EBF8FF', borderWidth: 1.5, borderColor: '#BEE3F8',
    borderRadius: BorderRadius.lg, padding: Spacing.md,
  },
  notesHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  notesHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notesTitle: {
    fontSize: FontSize.base, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: '#1E40AF',
  },
  editBtn: { padding: 4 },
  notesBody: {
    fontSize: FontSize.sm, color: '#1E40AF', lineHeight: 20,
  },
  notesEditArea: { gap: 8 },
  notesInput: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#93C5FD',
    borderRadius: BorderRadius.sm, padding: Spacing.sm,
    fontSize: FontSize.sm, color: Colors.textPrimary,
    textAlignVertical: 'top', minHeight: 70,
  },
  notesEditButtons: { flexDirection: 'row', gap: 8 },
  saveNoteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, backgroundColor: '#3182CE',
    borderRadius: BorderRadius.sm,
  },
  saveNoteBtnText: {
    fontSize: FontSize.sm, fontWeight: '600',
    fontFamily: 'Raleway_600SemiBold', color: '#fff',
  },
  cancelNoteBtn: {
    paddingHorizontal: Spacing.base, paddingVertical: 8,
    backgroundColor: '#E2E8F0', borderRadius: BorderRadius.sm, alignItems: 'center',
  },
  cancelNoteBtnText: {
    fontSize: FontSize.sm, fontWeight: '600',
    fontFamily: 'Raleway_600SemiBold', color: Colors.textSecondary,
  },

  // Lightbox
  lightboxOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute', top: 60, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  lightboxImage: {
    width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.75,
  },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row', gap: 12, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, borderTopWidth: 1,
    borderTopColor: Colors.border, backgroundColor: '#fff',
  },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: BorderRadius.md,
  },
  prevBtn: { backgroundColor: Colors.surfaceSecondary },
  navBtnDisabled: { backgroundColor: '#F7FAFC' },
  navBtnText: {
    fontSize: FontSize.base, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: Colors.textSecondary,
  },
  navBtnTextDisabled: { color: Colors.textMuted },
  nextBtnWrap: { flex: 1 },
  nextBtnText: {
    fontSize: FontSize.base, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: '#fff',
  },
});
