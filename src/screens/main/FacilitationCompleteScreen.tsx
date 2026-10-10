import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../../theme';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import PhotoConsentModal from '../../components/PhotoConsentModal';
import PhotoStrip from '../../components/PhotoStrip';
import { useStore } from '../../store/useStore';
import {
  addCommunityNote, recordFacilitationSession, addActivityPhotos,
  MIN_EXPERIENCE_CHARS,
} from '../../services/api';
import { trackNoteAdded, trackFacilitation } from '../../services/analytics';
import { sendPushToUser } from '../../services/notifications';

/** 1st, 2nd, 3rd, 4th… */
function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

export default function FacilitationCompleteScreen({ route, navigation }: { route: any; navigation: any }) {
  const { activity, studentCount } = route.params;
  const [communityNote, setCommunityNote] = useState('');
  const [noteRating, setNoteRating] = useState(0);
  const [loading, setLoading] = useState(false);
  // Added as each upload lands, tied to the run that produced it. Picking is
  // the only step; there is no separate confirm.
  const photoUpload = usePhotoUpload({
    onUploaded: async (photo) => {
      let runId: string | undefined;
      try {
        runId = await ensureSession();
      } catch {
        runId = undefined;
      }
      await addActivityPhotos(activity.id, [photo], runId);
    },
  });
  const [recordFailed, setRecordFailed] = useState(false);
  const {
    user,
    incrementFacilitationCount, facilitationCount,
    facilitationNotes, facilitationStartedAt,
  } = useStore();

  // The run is recorded once, whichever button asks for it first, so marking a
  // facilitation and then publishing a note cannot log the same run twice.
  const sessionId = useRef<string | null>(null);
  const pendingSession = useRef<Promise<string> | null>(null);
  const [recording, setRecording] = useState(true);

  const ensureSession = useCallback((): Promise<string> => {
    if (sessionId.current) return Promise.resolve(sessionId.current);
    if (!pendingSession.current) {
      setRecording(true);
      setRecordFailed(false);
      pendingSession.current = recordFacilitationSession({
        activityId: activity.id,
        studentCount,
        startedAt: facilitationStartedAt ?? new Date().toISOString(),
        stepNotes: facilitationNotes,
      })
        .then((session) => {
          sessionId.current = session.id;
          // Local tally moves only once the run is genuinely on record.
          incrementFacilitationCount(activity.id);
          setRecording(false);
          trackFacilitation(activity.id, studentCount).catch(() => {});
          // The author hears that someone ran their activity. No-ops when they
          // are the one running it.
          sendPushToUser(activity.created_by, user?.id, {
            title: 'Your activity was facilitated',
            body: `Someone just ran "${activity.title}" with ${studentCount} participants.`,
            data: { type: 'facilitate', activity_id: activity.id },
          });
          return session.id;
        })
        .catch((err: any) => {
          pendingSession.current = null; // let the next attempt try again
          setRecording(false);
          setRecordFailed(true);
          // The educator can do nothing about the cause, so the real reason
          // goes to the console instead of the screen. A `permission-denied`
          // here almost always means the facilitation_sessions rules have not
          // been deployed to the Firebase project yet.
          console.warn(
            '[Facilitation] Could not record session:',
            err?.code ?? err?.message ?? err,
          );
          throw err;
        });
    }
    return pendingSession.current;
  }, [
    activity.id, studentCount, facilitationStartedAt,
    facilitationNotes, incrementFacilitationCount,
  ]);

  // Reaching this screen *is* the facilitation, so the run records itself.
  // Writing a note stays separate and optional -- it is a reflection on the
  // run, not the thing that makes the run count.
  useEffect(() => {
    ensureSession().catch(() => {
      // Surfaced inline by `recordFailed`, with a retry, rather than as an alert
      // the educator has to dismiss before they can write anything.
    });
  }, []);

  /** An experience needs a rating and enough words to be worth reading. */
  const noteReady =
    noteRating > 0 && communityNote.trim().length >= MIN_EXPERIENCE_CHARS;

  const handlePostNote = async () => {
    if (noteRating === 0) {
      Alert.alert('Add a rating', 'Tap a star to rate how the activity went.');
      return;
    }
    if (communityNote.trim().length < MIN_EXPERIENCE_CHARS) {
      Alert.alert(
        'A bit more, please',
        'Say what happened, what worked, or what you would change. A sentence or two is plenty.',
      );
      return;
    }

    setLoading(true);
    try {
      // A note is a reflection on a run, so the run goes on record first. If
      // that write fails the note is still published, just unlinked -- losing
      // the reflection would be the worse outcome.
      let runId: string | undefined;
      try {
        runId = await ensureSession();
      } catch {
        runId = undefined;
      }

      await addCommunityNote(
        activity.id,
        communityNote.trim(),
        noteRating,
        undefined,
        runId,
      );
      await trackNoteAdded(activity.id, noteRating > 0, 0);
      Alert.alert(
        'Experience shared',
        'Other educators can now see how it went for you.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ActivityDetail', { activityId: activity.id, activity }),
          },
        ],
      );
    } catch (err: any) {
      console.warn('[Experience] save failed:', err?.code ?? err?.message ?? err);
      Alert.alert('Could not share', 'Please try again in a moment.');
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
      <PhotoConsentModal
        visible={photoUpload.consentVisible}
        onCancel={photoUpload.cancelConsent}
        onConfirm={photoUpload.handleConsent}
      />
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
                {ordinal(myCount)} time you've run this
              </Text>
            </View>
          )}
        </View>

        {/* Run status — recorded automatically, not a button to press. */}
        {recordFailed ? (
          <TouchableOpacity
            style={styles.runStatusFailed}
            onPress={() => { ensureSession().catch(() => {}); }}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
            <Text style={styles.runStatusFailedText}>
              Couldn't save this run. Tap to retry
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.runStatus}>
            {recording ? (
              <ActivityIndicator size="small" color="#38A169" />
            ) : (
              <Ionicons name="checkmark-circle" size={18} color="#38A169" />
            )}
            <Text style={styles.runStatusText}>
              {recording ? 'Saving this run…' : 'Run saved'}
            </Text>
          </View>
        )}

        {/* Photos, on their own. No writing required, and they survive a
            deleted experience because they are stored separately. */}
        <View style={styles.noteSection}>
          <View style={styles.noteHeader}>
            <Ionicons name="images-outline" size={18} color="#3182CE" />
            <Text style={styles.noteTitle}>What Participants Made</Text>
          </View>

          <PhotoStrip
            photos={photoUpload.photos}
            onRemove={photoUpload.removePhoto}
            onRetry={photoUpload.retryPhoto}
            onCaptionChange={photoUpload.setCaption}
          />

          <TouchableOpacity
            style={styles.photoBtn}
            onPress={photoUpload.openPicker}
            disabled={photoUpload.isUploading || !photoUpload.canAddMore}
            activeOpacity={0.85}
          >
            {photoUpload.isUploading ? (
              <ActivityIndicator size="small" color="#3182CE" />
            ) : (
              <Ionicons name="camera-outline" size={18} color="#3182CE" />
            )}
            <Text style={styles.photoBtnText}>
              {photoUpload.isUploading
                ? 'Adding...'
                : 'Add photos'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Share Your Experience - rating and words, no photos */}
        <View style={styles.noteSection}>
          <View style={styles.noteHeader}>
            <Ionicons name="chatbubble-outline" size={18} color="#3182CE" />
            <Text style={styles.noteTitle}>Share Your Experience (optional)</Text>
          </View>

          <Text style={styles.noteLabel}>Rate it</Text>
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

          {/* A floor, not a cap: says "minimum" so the slash does not read
              as a limit, and disappears once met rather than counting past
              it. The unit is spelled out because "min" once read as
              minutes. */}
          {communityNote.trim().length < MIN_EXPERIENCE_CHARS && (
            <Text style={[styles.charCount, styles.charCountWarn]}>
              {`${communityNote.trim().length} / ${MIN_EXPERIENCE_CHARS} chars minimum`}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.postButton, !noteReady && styles.submitDisabled]}
            onPress={handlePostNote}
            disabled={loading || !noteReady}
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
                  <Text style={styles.postButtonText}>Share Your Experience</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Remix — the adaptations are freshest right after a run. */}
        <TouchableOpacity
          style={styles.remixButton}
          onPress={() =>
            navigation.navigate('CreateTab', {
              screen: 'ReviewActivity',
              params: { remixFrom: activity },
            })
          }
          activeOpacity={0.85}
        >
          <Ionicons name="git-branch-outline" size={18} color={Colors.primary} />
          <Text style={styles.remixButtonText}>Remix with your changes</Text>
        </TouchableOpacity>
        <Text style={styles.remixHint}>
          Ran it differently? Publish your version, crediting the original.
        </Text>

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
  runStatus: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: BorderRadius.lg,
    backgroundColor: '#F0FFF4',
  },
  runStatusText: {
    fontSize: FontSize.sm, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: '#2F855A',
  },
  runStatusFailed: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: BorderRadius.lg,
    backgroundColor: '#FFF5F5',
  },
  runStatusFailedText: {
    fontSize: FontSize.sm, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: Colors.error,
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
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, backgroundColor: '#EBF8FF',
    borderRadius: 8,
  },
  photoBtnText: {
    fontSize: FontSize.sm, fontWeight: '600',
    fontFamily: 'Raleway_600SemiBold', color: '#3182CE',
  },
  postButton: { borderRadius: 14, overflow: 'hidden' },
  postButtonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14,
  },
  postButtonText: {
    fontSize: FontSize.base, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: '#fff',
  },
  remixButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13,
    borderRadius: BorderRadius.lg, borderWidth: 1.5,
    borderColor: Colors.primary, backgroundColor: '#FFF5F5',
  },
  remixButtonText: {
    fontSize: FontSize.base, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: Colors.primary,
  },
  remixHint: {
    fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: -8,
  },
  submitDisabled: { opacity: 0.45 },
  skipButton: {
    paddingVertical: 12, alignItems: 'center',
  },
  skipButtonText: {
    fontSize: FontSize.base, fontWeight: '600',
    fontFamily: 'Raleway_600SemiBold', color: Colors.textMuted,
  },
});
