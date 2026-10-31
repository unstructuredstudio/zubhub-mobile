import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking, Image, FlatList,
  Modal, Dimensions, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { downloadActivityPDF, openOrSharePDF } from '../../services/download';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import PhotoConsentModal from '../../components/PhotoConsentModal';
import PhotoStrip from '../../components/PhotoStrip';
import { shareActivity } from '../../services/share';
import { trackActivityView, trackNoteAdded } from '../../services/analytics';
import { sendPushToUser } from '../../services/notifications';
import {
  deleteCommunityNote, addCommunityNote, deleteActivity, fetchActivity,
  addActivityPhotos, deleteActivityPhoto,
  MIN_EXPERIENCE_CHARS,
} from '../../services/api';
import { translateActivity, translateText } from '../../services/translate';
import { useStore } from '../../store/useStore';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCommunityNotes, useFacilitationSessions, useUserProfiles, useActivityPhotos,
} from '../../hooks/useActivities';
import {
  ActivityPhoto, CommunityNote, FacilitationSession, NotePhoto, UserProfile,
} from '../../types';
import { Colors } from '../../theme';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Three-up grid inside a Section: 16pt margin + 16pt padding a side, two 6pt gaps.
const PHOTO_CELL = (SCREEN_WIDTH - 64 - 12) / 3;

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

// ─── Image Lightbox ─────────────────────────────────────────────────────────
function LightboxPage({ photo }: { photo: NotePhoto }) {
  return (
    <View style={styles.lightboxPage}>
      <Image source={{ uri: photo.url }} style={styles.lightboxImage} resizeMode="contain" />
      {photo.caption?.trim() ? (
        <Text style={styles.lightboxCaption}>{photo.caption}</Text>
      ) : null}
    </View>
  );
}

function ImageLightbox({ photos, visible, initialIndex, onClose }: {
  photos: NotePhoto[];
  visible: boolean;
  initialIndex: number;
  onClose: () => void;
}) {
  const flatListRef = useRef<FlatList>(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.lightboxOverlay}>
        <TouchableOpacity style={styles.lightboxClose} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        {photos.length === 1 ? (
          <LightboxPage photo={photos[0]} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={photos}
            horizontal
            pagingEnabled
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => `${i}-${item.url}`}
            renderItem={({ item }) => <LightboxPage photo={item} />}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── In-app Video Player ──────────────────────────────────────────────────────
function VideoPlayer({ ytId }: { ytId: string }) {
  const embedHtml = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden;background:#000}
iframe{width:100%;height:100%;border:0}</style>
</head><body>
<iframe src="https://www.youtube.com/embed/${ytId}?playsinline=1&rel=0&modestbranding=1&cc_load_policy=1"
  allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen></iframe>
</body></html>`;

  return (
    <Section title="Video">
      <View style={styles.videoEmbedContainer}>
        <WebView
          source={{ html: embedHtml, baseUrl: 'https://zubhub.app' }}
          style={styles.videoEmbedWebView}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          scrollEnabled={false}
          allowsFullscreenVideo
          originWhitelist={['*']}
        />
      </View>
    </Section>
  );
}

export default function ActivityDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const activity = route.params?.activity;
  if (!activity) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#718096' }}>Activity not found.</Text>
      </View>
    );
  }
  const [downloading, setDownloading] = useState(false);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [translating, setTranslating] = useState(false);
  const [displayActivity, setDisplayActivity] = useState(activity);
  const { user, selectedLanguage } = useStore();
  const queryClient = useQueryClient();

  // Image lightbox state
  const [lightboxPhotos, setLightboxPhotos] = useState<NotePhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxVisible, setLightboxVisible] = useState(false);

  // Jumping from a note's photo chip up to that author's tiles in the gallery.
  const [openingSource, setOpeningSource] = useState(false);
  // Both sections grow without bound as an activity gets used. Rather than
  // moving them to their own screens — which would put a tap between an
  // educator and the social proof they came for — they stay inline and capped.
  const [showAllExperiences, setShowAllExperiences] = useState(false);

  // Inline note form state
  const [noteText, setNoteText] = useState('');
  const [noteRating, setNoteRating] = useState(0);
  const [noteLoading, setNoteLoading] = useState(false);
  // Each photo is added the moment it finishes uploading, so picking is the
  // only step. There is no separate confirm.
  const photoUpload = usePhotoUpload({
    onUploaded: async (photo) => {
      await addActivityPhotos(activity.id, [photo]);
      queryClient.invalidateQueries({ queryKey: ['photos', activity.id] });
    },
  });
  const [showNoteForm, setShowNoteForm] = useState(false);

  const openLightbox = (photos: NotePhoto[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setLightboxVisible(true);
  };

  /**
   * Opens the activity this one was remixed from. The screen needs the whole
   * activity rather than an id, so it is fetched first — which also gives the
   * deleted-original case somewhere to land.
   */
  const openRemixSource = async (sourceId: string) => {
    setOpeningSource(true);
    try {
      const source = await fetchActivity(sourceId);
      navigation.push('ActivityDetail', { activityId: source.id, activity: source });
    } catch {
      Alert.alert(
        'Original unavailable',
        'That activity could not be opened. It may have been removed.',
      );
    } finally {
      setOpeningSource(false);
    }
  };

  // Fetch real community notes from Firestore
  const { data: communityNotes = [] } = useCommunityNotes(activity.id);
  const { data: runs = [], error: runsError } = useFacilitationSessions(activity.id);
  const { data: activityPhotos = [] } = useActivityPhotos(activity.id);

  const handleDeleteNote = (noteId: string) => {
    // The photos sit on the card being deleted, so what goes with it is visible
    // rather than needing to be spelled out.
    Alert.alert(
      'Delete experience',
      'This removes the note and its photos. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCommunityNote(noteId, activity.id);
              queryClient.invalidateQueries({ queryKey: ['notes', activity.id] });
            } catch {
              Alert.alert('Error', 'Could not delete note. Please try again.');
            }
          },
        },
      ],
    );
  };
  const [translatedNotes, setTranslatedNotes] = useState<CommunityNote[]>([]);

  // Stable key to detect when notes actually change (avoids reference-equality loops)
  const notesKey = communityNotes.map((n: CommunityNote) => n.id).join(',');

  // Run totals. `facilitation_count` is the denormalised tally on the activity;
  // the session documents are the detail behind it, so the count falls back to
  // the activity field when sessions have not loaded (or in demo mode).
  const runsKey = runs.map((r: FacilitationSession) => r.id).join(',');
  const runStats = React.useMemo(() => {
    const participants = runs.reduce(
      (sum: number, r: FacilitationSession) => sum + (r.student_count || 0),
      0,
    );
    return {
      // The larger of the two on purpose. `facilitation_count` is the running
      // tally and includes runs facilitated before session documents existed;
      // `runs.length` only counts sessions actually on record. Preferring
      // `runs.length` made this screen report fewer sessions than the activity
      // card on the home feed, which reads the tally.
      runCount: Math.max(runs.length, activity.facilitation_count ?? 0),
      participants,
    };
  }, [runsKey, activity.facilitation_count]);

  /** Experiences shown before "Show N more". */
  const VISIBLE_EXPERIENCES = 3;

  /** Group size and date for a report, when it came from a recorded run. */
  const runsById = React.useMemo(() => {
    const map: Record<string, FacilitationSession> = {};
    runs.forEach((r: FacilitationSession) => { map[r.id] = r; });
    return map;
  }, [runsKey]);

  /** Distinct educators who have run this, most sessions first. */
  const educatorRuns = React.useMemo(() => {
    const counts: Record<string, number> = {};
    runs.forEach((r: FacilitationSession) => {
      if (r.user_id) counts[r.user_id] = (counts[r.user_id] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([userId, sessions]) => ({ userId, sessions }))
      .sort((a, b) => b.sessions - a.sessions);
  }, [runsKey]);

  const educatorIds = educatorRuns.map((e) => e.userId);
  const { data: educatorProfiles = [] } = useUserProfiles(educatorIds);

  const educators = React.useMemo(() => {
    const byId: Record<string, UserProfile> = {};
    educatorProfiles.forEach((p: UserProfile) => { byId[p.id] = p; });
    // A profile that failed to load is dropped rather than shown nameless.
    return educatorRuns
      .map((e) => ({ ...e, profile: byId[e.userId] }))
      .filter((e) => !!e.profile);
  }, [educatorRuns, educatorProfiles]);

  const formatRunDate = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };

  // Keep translated notes in sync with fetched notes
  useEffect(() => {
    setTranslatedNotes(communityNotes);
  }, [notesKey]);

  // Auto-translate all content whenever language changes
  useEffect(() => {
    if (selectedLanguage === 'en') {
      setDisplayActivity(activity);
      setTranslatedNotes(communityNotes);
      return;
    }
    let cancelled = false;
    setTranslating(true);
    Promise.all([
      translateActivity(activity, selectedLanguage),
      Promise.all(communityNotes.map(async (n: CommunityNote) => ({ ...n, note: await translateText(n.note, selectedLanguage) }))),
    ])
      .then(([translated, notes]) => {
        if (!cancelled) {
          setDisplayActivity(translated);
          setTranslatedNotes(notes);
        }
      })
      .catch((err) => {
        console.error('[Translate] Failed:', err);
        if (!cancelled) {
          setDisplayActivity(activity);
          setTranslatedNotes(communityNotes);
        }
      })
      .finally(() => { if (!cancelled) setTranslating(false); });
    return () => { cancelled = true; };
  }, [selectedLanguage, notesKey]);

  useEffect(() => {
    trackActivityView(activity.id);
  }, [activity.id]);

  const handleDownload = async () => {
    setDownloading(true);
    const uri = await downloadActivityPDF(activity, (p) => setDownloadPercent(p.percent));
    setDownloading(false);
    if (uri) await openOrSharePDF(uri);
    sendPushToUser(activity.created_by, user?.id, {
      title: 'Your activity was downloaded',
      body: `Someone saved "${activity.title}" to use offline.`,
      data: { type: 'download', activity_id: activity.id },
    });
  };

  const handleShare = () => shareActivity(activity, user?.id);


  const isOwner = !!(user?.id && activity.created_by && user.id === activity.created_by);

  const handleEdit = () => {
    navigation.navigate('CreateTab', {
      screen: 'ReviewActivity',
      params: { activity },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to permanently delete this activity? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteActivity(activity.id);
              queryClient.invalidateQueries({ queryKey: ['activities'] });
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Could not delete activity. Please try again.');
            }
          },
        },
      ],
    );
  };

  // Inline note handlers
  const handleDeletePhoto = (photo: ActivityPhoto) => {
    const isMine = photo.user_id === user?.id;
    const isOwnerOfActivity = activity.created_by === user?.id;
    if (!isMine && !isOwnerOfActivity) return;

    Alert.alert('Remove photo', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteActivityPhoto(photo.id);
            queryClient.invalidateQueries({ queryKey: ['photos', activity.id] });
          } catch {
            Alert.alert('Error', 'Could not remove the photo.');
          }
        },
      },
    ]);
  };

  /** An experience needs a rating and enough words to be worth reading. */
  const noteReady =
    noteRating > 0 && noteText.trim().length >= MIN_EXPERIENCE_CHARS;

  const handleSubmitNote = async () => {
    if (noteRating === 0) {
      Alert.alert('Add a rating', 'Tap a star to rate how the activity went.');
      return;
    }
    if (noteText.trim().length < MIN_EXPERIENCE_CHARS) {
      Alert.alert(
        'A bit more, please',
        'Say what happened, what worked, or what you would change. A sentence or two is plenty.',
      );
      return;
    }
    setNoteLoading(true);
    try {
      await addCommunityNote(activity.id, noteText.trim(), noteRating);
      await trackNoteAdded(activity.id, noteRating > 0, 0);
      sendPushToUser(activity.created_by, user?.id, {
        title: 'New experience shared',
        body: `Someone shared how "${activity.title}" went for them.`,
        data: { type: 'add_note', activity_id: activity.id },
      });
      queryClient.invalidateQueries({ queryKey: ['notes', activity.id] });
      setNoteText('');
      setNoteRating(0);
      setShowNoteForm(false);
    } catch (err: any) {
      console.warn('[Experience] save failed:', err?.code ?? err?.message ?? err);
      Alert.alert('Could not share', 'Please try again in a moment.');
    } finally {
      setNoteLoading(false);
    }
  };

  const ageRange = activity.max_age
    ? `Ages ${activity.min_age}–${activity.max_age}`
    : `Ages ${activity.min_age}+`;


  return (
    <View style={styles.container}>
      <ImageLightbox
        photos={lightboxPhotos}
        visible={lightboxVisible}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxVisible(false)}
      />
      <PhotoConsentModal
        visible={photoUpload.consentVisible}
        onCancel={photoUpload.cancelConsent}
        onConfirm={photoUpload.handleConsent}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#E53E3E', '#ED64A6']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerNav}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerNavRight}>
                {isOwner && (
                  <>
                    <TouchableOpacity onPress={handleEdit} style={styles.headerNavBtn}>
                      <Ionicons name="create-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} style={styles.headerNavBtn}>
                      <Ionicons name="trash-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FEE000" />
              <Text style={styles.ratingText}>{activity.rating}</Text>
              <Text style={styles.ratingDot}>•</Text>
              <Ionicons name="download-outline" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.ratingCount}>{(activity.download_count ?? 0).toLocaleString()}</Text>
              <Text style={styles.ratingDot}>•</Text>
              <Ionicons name="share-social-outline" size={13} color="rgba(255,255,255,0.85)" />
              <Text style={styles.ratingCount}>{activity.share_count ?? 0} shares</Text>
              {activity.rating_count > 0 && (
                <>
                  <Text style={styles.ratingDot}>•</Text>
                  <Ionicons name="chatbubble-outline" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.ratingCount}>{activity.rating_count} reviews</Text>
                </>
              )}
              {runStats.runCount > 0 && (
                <>
                  <Text style={styles.ratingDot}>•</Text>
                  <Ionicons name="ribbon-outline" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.ratingCount}>
                    {runStats.runCount} session{runStats.runCount === 1 ? '' : 's'}
                  </Text>
                </>
              )}
            </View>
            <Text style={styles.activityTitle}>{displayActivity.title}</Text>
            <Text style={styles.activityDesc}>{displayActivity.description}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaChipText}>{activity.duration_minutes} min</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaChipText}>{ageRange}</Text>
              </View>
              {activity.creator_name && (
                <TouchableOpacity
                  style={styles.metaChip}
                  activeOpacity={0.75}
                  disabled={!activity.created_by}
                  onPress={() =>
                    navigation.push('EducatorProfile', {
                      userId: activity.created_by,
                      name: activity.creator_name,
                    })
                  }
                >
                  <Ionicons name="person-outline" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metaChipText}>{activity.creator_name}</Text>
                </TouchableOpacity>
              )}

              {(activity.remix_count ?? 0) > 0 && (
                <View style={styles.metaChip}>
                  <Ionicons name="git-branch-outline" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metaChipText}>
                    {activity.remix_count} remix{activity.remix_count === 1 ? '' : 'es'}
                  </Text>
                </View>
              )}
            </View>

            {/* Credit back to the original. Tapping opens it; the stored title
                is used so the credit survives the source being renamed. */}
            {activity.remixed_from && (
              <TouchableOpacity
                style={styles.remixCredit}
                onPress={() => openRemixSource(activity.remixed_from!.id)}
                disabled={openingSource}
                activeOpacity={0.75}
              >
                {openingSource ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="git-branch-outline" size={12} color="rgba(255,255,255,0.9)" />
                )}
                <Text style={styles.remixCreditText} numberOfLines={1}>
                  Remixed from {activity.remixed_from.title}
                  {activity.remixed_from.creator_name
                    ? ` by ${activity.remixed_from.creator_name}`
                    : ''}
                </Text>
              </TouchableOpacity>
            )}
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          {/* Secondary actions: icon-led, one word each. */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.iconAction}
              onPress={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator color="#3182CE" size="small" />
              ) : (
                <Ionicons name="download-outline" size={20} color="#3182CE" />
              )}
              <Text style={styles.iconActionText}>
                {downloading ? `${downloadPercent}%` : 'PDF'}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.iconAction} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color="#25D366" />
              <Text style={styles.iconActionText}>Share</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            {/* Remix is not gated on steps: an activity without them is still
                worth adapting. */}
            <TouchableOpacity
              style={styles.iconAction}
              onPress={() =>
                navigation.navigate('CreateTab', {
                  screen: 'ReviewActivity',
                  params: { remixFrom: activity },
                })
              }
            >
              <Ionicons name="git-branch-outline" size={20} color={Colors.primary} />
              <Text style={styles.iconActionText}>Remix</Text>
            </TouchableOpacity>
          </View>

          {/* Featured image */}
          {displayActivity.featured_image_url && (
            <Image
              source={{ uri: displayActivity.featured_image_url }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
          )}

          {/* Primary action */}
          {activity.steps?.length > 0 && (
            <TouchableOpacity
              style={styles.facilitationCTA}
              onPress={() => navigation.navigate('FacilitationSetup', { activity })}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientEnd]}
                style={styles.facilitationCTAGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="play" size={18} color="#fff" />
                <Text style={styles.facilitationCTAText}>Facilitate</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Translating / translated banners */}
          {translating ? (
            <View style={styles.translatingBar}>
              <ActivityIndicator size="small" color="#3182CE" />
              <Text style={styles.translatingText}>Translating activity...</Text>
            </View>
          ) : selectedLanguage !== 'en' && (
            <View style={styles.translationWarning}>
              <Ionicons name="warning-outline" size={18} color="#B7791F" />
              <View style={styles.translationWarningBody}>
                <Text style={styles.translationWarningTitle}>Machine-translated content</Text>
                <Text style={styles.translationWarningText}>
                  This activity was auto-translated and may contain errors or awkward phrasing.
                  For accurate instructions, switch back to English before running the workshop.
                </Text>
              </View>
            </View>
          )}

          {/* Objectives */}
          {displayActivity.objectives?.length > 0 && (
            <Section title="Objectives">
              {displayActivity.objectives.map((obj: string, i: number) => (
                <View key={i} style={styles.listRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>{obj}</Text>
                </View>
              ))}
            </Section>
          )}

          {/* Materials */}
          {displayActivity.materials?.length > 0 && (
            <Section title="Materials">
              {displayActivity.materials.map((m: any, i: number) => (
                <View key={i} style={styles.materialRow}>
                  {/* Where-to-get sits under the name rather than beside it: a long
                      hint in its own column squeezed the name to a few letters a line. */}
                  <View style={styles.materialLeft}>
                    <Text style={styles.materialName}>{m.name}</Text>
                    {m.price && <Text style={styles.materialPrice}>{m.price}</Text>}
                    {m.buy_hint && (
                      <View style={styles.buyHintRow}>
                        <Ionicons name="location-outline" size={11} color="#A0AEC0" />
                        <Text style={styles.buyHint}>{m.buy_hint}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.materialRight}>
                    {m.amazon_url && (
                      <TouchableOpacity onPress={() => Linking.openURL(m.amazon_url)}>
                        <View style={styles.amazonBtn}>
                          <Ionicons name="cart-outline" size={13} color="#3182CE" />
                          <Text style={styles.amazonText}>Buy online</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </Section>
          )}

          {/* Steps */}
          {displayActivity.steps?.length > 0 && (
            <Section title="Step-by-Step Guide">
              {displayActivity.steps.map((step: any) => (
                <View key={step.number} style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{step.number}</Text>
                    </View>
                    <View style={styles.stepInfo}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepTime}>{step.duration_minutes} min</Text>
                    </View>
                  </View>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                  {step.images?.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepImgRow}>
                      {step.images.map((uri: string, idx: number) => (
                        <TouchableOpacity key={idx} onPress={() => openLightbox(step.images.map((url: string) => ({ url })), idx)} activeOpacity={0.85}>
                          <Image source={{ uri }} style={styles.stepImg} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              ))}
            </Section>
          )}

          {/* Video */}
          {activity.video_url && (() => {
            const ytId = getYouTubeVideoId(activity.video_url);
            if (ytId) {
              return <VideoPlayer ytId={ytId} />;
            }
            // Non-YouTube: open externally
            return (
              <Section title="Video">
                <TouchableOpacity
                  style={styles.videoCard}
                  onPress={() => Linking.openURL(activity.video_url)}
                  activeOpacity={0.85}
                >
                  <View style={styles.videoPlayOverlay}>
                    <View style={styles.videoPlayCircle}>
                      <Ionicons name="play" size={28} color="#fff" />
                    </View>
                    <Text style={styles.videoLinkText}>Watch Video</Text>
                  </View>
                </TouchableOpacity>
              </Section>
            );
          })()}

          {/* What participants made. Its own collection and its own button, so
              adding photos needs no writing and deleting an experience cannot
              take them away. */}
          <Section
            title="What Participants Made"
          >
            {activityPhotos.length > 0 && (
              <View style={styles.photoGrid}>
                {activityPhotos.map((photo: ActivityPhoto, idx: number) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.photoCell}
                    activeOpacity={0.85}
                    onPress={() => openLightbox(
                      activityPhotos.map((p: ActivityPhoto) => ({ url: p.url, caption: p.caption })),
                      idx,
                    )}
                    onLongPress={() => handleDeletePhoto(photo)}
                  >
                    <Image source={{ uri: photo.url }} style={styles.photoImg} />

                    {/* Long-press alone was undiscoverable: nothing on the tile
                        said a photo could be removed. Shown only to the people
                        the rules actually allow to remove it. */}
                    {(photo.user_id === user?.id || activity.created_by === user?.id) && (
                      <TouchableOpacity
                        style={styles.photoRemove}
                        onPress={() => handleDeletePhoto(photo)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close" size={13} color="#fff" />
                      </TouchableOpacity>
                    )}

                    <View style={styles.photoAttrib}>
                      <Text style={styles.photoAttribText} numberOfLines={1}>
                        {photo.user_name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activityPhotos.length === 0 && (
              <Text style={styles.noNotesText}>
                No photos yet. Add what your group made.
              </Text>
            )}

            <PhotoStrip
              photos={photoUpload.photos}
              onRemove={photoUpload.removePhoto}
              onRetry={photoUpload.retryPhoto}
              onCaptionChange={photoUpload.setCaption}
            />

            <TouchableOpacity
              style={styles.addPhotosBtn}
              onPress={photoUpload.openPicker}
              disabled={photoUpload.isUploading || !photoUpload.canAddMore}
              activeOpacity={0.85}
            >
              {photoUpload.isUploading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="camera-outline" size={18} color={Colors.primary} />
              )}
              <Text style={styles.addPhotosText}>
                {photoUpload.isUploading
                  ? 'Adding...'
                  : 'Add photos'}
              </Text>
            </TouchableOpacity>
          </Section>

          {educators.length > 0 && (
            <Section
              title="Educators Who Ran This"
              subtitle="Tap to see what else they have made"
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {educators.map(({ userId, sessions, profile }) => (
                  <TouchableOpacity
                    key={userId}
                    style={styles.educatorCard}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.push('EducatorProfile', {
                        userId,
                        name: profile!.full_name,
                        organization: profile!.organization,
                        bio: profile!.bio,
                      })
                    }
                  >
                    <Image
                      source={{
                        uri: `https://robohash.org/${encodeURIComponent(userId)}?set=set1&size=120x120&bgset=bg1`,
                      }}
                      style={styles.educatorAvatar}
                    />
                    <Text style={styles.educatorName} numberOfLines={1}>
                      {profile!.full_name}
                    </Text>
                    <Text style={styles.educatorMeta}>
                      {sessions} session{sessions === 1 ? '' : 's'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Section>
          )}

          {/* Reports from people who ran this — the facilitator's own included. */}
          <Section
            title="Experiences"
          >
            {translatedNotes.length === 0 && !showNoteForm && (
              <Text style={styles.noNotesText}>
                No one has shared how this went yet. Be the first.
              </Text>
            )}
            {(showAllExperiences
              ? translatedNotes
              : translatedNotes.slice(0, VISIBLE_EXPERIENCES)
            ).map((note: CommunityNote) => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <View style={styles.noteAvatar}>
                    <Text style={styles.noteAvatarText}>{note.user_name?.[0] ?? '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.noteUserRow}>
                      <Text style={styles.noteUser}>{note.user_name}</Text>
                      {note.user_id === activity.created_by && (
                        <View style={styles.authorBadge}>
                          <Text style={styles.authorBadgeText}>Author</Text>
                        </View>
                      )}
                    </View>
                    {/* Which run this report is about. Absent on reports written
                        from the activity page rather than after facilitating. */}
                    {(() => {
                      const run = note.session_id ? runsById[note.session_id] : undefined;
                      if (!run) return null;
                      const when = formatRunDate(run.completed_at);
                      const parts = [
                        run.student_count > 0 ? `${run.student_count} participants` : null,
                        when,
                      ].filter(Boolean);
                      if (parts.length === 0) return null;
                      return <Text style={styles.noteRunMeta}>{parts.join(' · ')}</Text>;
                    })()}
                    {note.rating != null && (
                      <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons
                            key={s}
                            name="star"
                            size={11}
                            color={s <= (note.rating ?? 0) ? '#F6AD55' : '#E2E8F0'}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                  {note.user_id === user?.id && (
                    <TouchableOpacity onPress={() => handleDeleteNote(note.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="trash-outline" size={16} color="#E53E3E" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.noteText}>{note.note}</Text>
              </View>
            ))}

            {!showAllExperiences && translatedNotes.length > VISIBLE_EXPERIENCES && (
              <TouchableOpacity
                style={styles.showAllBtn}
                onPress={() => setShowAllExperiences(true)}
                activeOpacity={0.75}
              >
                <Text style={styles.showAllText}>
                  Show {translatedNotes.length - VISIBLE_EXPERIENCES} more
                </Text>
                <Ionicons name="chevron-down" size={14} color={Colors.primary} />
              </TouchableOpacity>
            )}

            {/* Inline note form */}
            {showNoteForm ? (
              <View style={styles.inlineNoteForm}>
                <Text style={styles.inlineNoteLabel}>Rate it</Text>
                <View style={styles.inlineStars}>
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
                  style={styles.inlineNoteInput}
                  placeholder="What happened? What worked well? What would you change?"
                  placeholderTextColor="#A0AEC0"
                  multiline
                  numberOfLines={4}
                  value={noteText}
                  onChangeText={setNoteText}
                  textAlignVertical="top"
                />

                {/* A floor, not a cap: says "minimum" so the slash does not read
                    as a limit, and disappears once met rather than counting past
                    it. The unit is spelled out because "min" once read as
                    minutes. */}
                {noteText.trim().length < MIN_EXPERIENCE_CHARS && (
                  <Text style={[styles.charCount, styles.charCountWarn]}>
                    {`${noteText.trim().length} / ${MIN_EXPERIENCE_CHARS} chars minimum`}
                  </Text>
                )}

                <View style={styles.inlineNoteActions}>
                  {/* Dimmed until it will actually work, which says the same
                      thing a running character count did without the text. */}
                  <TouchableOpacity
                    style={[
                      styles.inlineSubmitBtn,
                      !noteReady && styles.submitDisabled,
                    ]}
                    onPress={handleSubmitNote}
                    disabled={noteLoading || !noteReady}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={[Colors.gradientStart, Colors.gradientEnd]}
                      style={styles.inlineSubmitGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {noteLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="send-outline" size={16} color="#fff" />
                          <Text style={styles.inlineSubmitText}>Share Your Experience</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.inlineCancelBtn}
                    onPress={() => { setShowNoteForm(false); setNoteText(''); setNoteRating(0); }}
                  >
                    <Text style={styles.inlineCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addNoteBtn}
                onPress={() => setShowNoteForm(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color="#718096" />
                <Text style={styles.addNoteText}>Share Your Experience</Text>
              </TouchableOpacity>
            )}
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, subtitle, children }: {
  title: string;
  subtitle?: string | null;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  headerNavRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerNavBtn: { padding: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  ratingText: { fontSize: 14, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#fff' },
  ratingDot: { color: 'rgba(255,255,255,0.5)' },
  ratingCount: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  activityTitle: { fontSize: 24, fontWeight: '900', fontFamily: 'Raleway_800ExtraBold', color: '#fff', marginBottom: 6 },
  activityDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 21, marginBottom: 16 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  metaChipText: { fontSize: 12, color: '#fff', fontWeight: '600', fontFamily: 'Raleway_600SemiBold' },
  body: { paddingBottom: 32 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 14,
  },
  iconAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 6,
  },
  iconActionText: {
    fontSize: 13, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: '#4A5568',
  },
  actionDivider: { width: 1, height: 18, backgroundColor: '#E2E8F0' },
  translatingBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EBF8FF', borderWidth: 1, borderColor: '#BEE3F8',
    borderRadius: 10, marginHorizontal: 16, marginTop: 12, padding: 12,
  },
  translatingText: { fontSize: 13, color: '#2C5282' },
  translationWarning: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FFFBEB', borderWidth: 1.5, borderColor: '#F6AD55',
    borderRadius: 12, marginHorizontal: 16, marginTop: 12, padding: 14,
  },
  translationWarningBody: { flex: 1 },
  translationWarningTitle: {
    fontSize: 13, fontWeight: '700', fontFamily: 'Raleway_700Bold',
    color: '#744210', marginBottom: 3,
  },
  translationWarningText: { fontSize: 12, color: '#744210', lineHeight: 17 },
  section: {
    backgroundColor: '#fff', borderRadius: 16, margin: 16, marginBottom: 0,
    padding: 16,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', fontFamily: 'Raleway_800ExtraBold', color: '#1A202C', marginBottom: 12 },
  listRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  bullet: { color: '#38A169', fontSize: 16, lineHeight: 20 },
  listText: { fontSize: 14, color: '#4A5568', flex: 1, lineHeight: 21 },
  materialRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F4F8',
  },
  materialLeft: { flex: 1 },
  materialName: { fontSize: 14, color: '#1A202C', fontWeight: '500', fontFamily: 'Raleway_500Medium' },
  materialPrice: { fontSize: 12, color: '#718096', marginTop: 2 },
  materialRight: { alignItems: 'flex-end', gap: 4, marginLeft: 8 },
  buyHintRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  buyHint: { fontSize: 10, color: '#A0AEC0', fontStyle: 'italic', flexShrink: 1 },
  amazonBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amazonText: { fontSize: 12, color: '#3182CE', fontWeight: '600', fontFamily: 'Raleway_600SemiBold' },
  stepCard: {
    backgroundColor: '#F7FAFC', borderRadius: 12, padding: 12, marginBottom: 10,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#E53E3E',
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: 'Raleway_700Bold' },
  stepInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#1A202C', flex: 1, flexShrink: 1 },
  stepTime: { fontSize: 12, color: '#2D3748', flexShrink: 0, marginLeft: 8 },
  stepDesc: { fontSize: 13, color: '#2D3748', lineHeight: 20 },
  featuredImage: {
    width: '100%', height: 200,
    marginHorizontal: 0, marginBottom: 0,
  },
  stepImgRow: { marginTop: 10 },
  stepImg: {
    width: 120, height: 90, borderRadius: 8,
    marginRight: 8, backgroundColor: '#E2E8F0',
  },
  tipCallout: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    backgroundColor: '#FFFBEB', borderLeftWidth: 3, borderLeftColor: '#F6AD55',
    padding: 8, borderRadius: 4, marginTop: 8,
  },
  tipCalloutText: { fontSize: 12, color: '#744210', flex: 1 },
  noteCard: { backgroundColor: '#F7FAFC', borderRadius: 12, padding: 12, marginBottom: 10 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  noteAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#E53E3E',
    alignItems: 'center', justifyContent: 'center',
  },
  noteAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700', fontFamily: 'Raleway_700Bold' },
  noteUser: { fontSize: 12, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#1A202C' },
  stars: { flexDirection: 'row', gap: 2, marginTop: 2 },
  noteText: { fontSize: 13, color: '#4A5568', lineHeight: 19 },
  addNoteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E0',
    borderRadius: 12, paddingVertical: 12, marginTop: 4,
  },
  addNoteText: { fontSize: 14, color: '#718096', fontWeight: '600', fontFamily: 'Raleway_600SemiBold' },
  noNotesText: { fontSize: 13, color: '#A0AEC0', fontStyle: 'italic', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#718096', marginTop: -6, marginBottom: 10 },
  educatorCard: {
    width: 84, alignItems: 'center', marginRight: 12,
  },
  educatorAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#EDF2F7', marginBottom: 6,
  },
  educatorName: {
    fontSize: 12, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: Colors.textPrimary,
    textAlign: 'center',
  },
  educatorMeta: { fontSize: 10, color: '#718096', marginTop: 1 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  photoCell: {
    width: PHOTO_CELL, height: PHOTO_CELL,
    borderRadius: 8, overflow: 'hidden', backgroundColor: '#E2E8F0',
  },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoAttrib: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 5, paddingVertical: 3,
  },
  photoAttribText: {
    color: '#fff', fontSize: 9,
    fontWeight: '600', fontFamily: 'Raleway_600SemiBold',
  },
  addPhotosBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, marginTop: 12,
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: '#FFF5F5',
  },
  addPhotosText: {
    fontSize: 14, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: Colors.primary,
  },
  submitDisabled: { opacity: 0.45 },
  showAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, marginTop: 4,
  },
  showAllText: {
    fontSize: 13, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: Colors.primary,
  },
  noteRunMeta: { fontSize: 11, color: '#718096', marginTop: 1 },
  noteUserRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorBadge: {
    backgroundColor: '#FFF5F5', borderRadius: 999,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  authorBadgeText: {
    fontSize: 10, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: Colors.primary,
  },
  videoCard: {
    backgroundColor: '#1A202C', borderRadius: 12, overflow: 'hidden',
    aspectRatio: 16 / 9, justifyContent: 'center', alignItems: 'center',
  },
  videoEmbedContainer: {
    borderRadius: 12, overflow: 'hidden',
    height: 220, backgroundColor: '#000',
  },
  videoEmbedWebView: { flex: 1, backgroundColor: '#000' },
  videoPlayOverlay: { alignItems: 'center', gap: 8 },
  videoPlayCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(229,62,62,0.9)',
    alignItems: 'center', justifyContent: 'center', paddingLeft: 3,
  },
  videoLinkText: { color: '#fff', fontSize: 14, fontWeight: '700', fontFamily: 'Raleway_700Bold' },
  videoUrlText: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  remixCredit: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
    maxWidth: '100%',
  },
  remixCreditText: {
    flexShrink: 1,
    fontSize: 12, color: '#fff', fontWeight: '600',
    fontFamily: 'Raleway_600SemiBold',
  },
  facilitationCTA: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: 'hidden',
  },
  facilitationCTAGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13,
  },
  facilitationCTAText: {
    fontSize: 15, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#fff',
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
  lightboxPage: {
    width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center',
  },
  lightboxImage: {
    width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.75,
  },
  lightboxCaption: {
    color: '#fff', fontSize: 13, textAlign: 'center',
    paddingHorizontal: 24, paddingTop: 14,
  },
  // Inline note form
  inlineNoteForm: {
    backgroundColor: '#F7FAFC', borderRadius: 12, padding: 14, marginTop: 4,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  inlineNoteLabel: { fontSize: 14, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#4A5568', marginBottom: 8 },
  inlineStars: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  inlineNoteInput: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    padding: 14, fontSize: 14, color: '#1A202C',
    backgroundColor: '#fff', minHeight: 100,
  },
  charCount: { fontSize: 11, color: '#718096', textAlign: 'right', marginTop: 4 },
  charCountWarn: { color: Colors.error },
  inlinePhotoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, marginTop: 8,
    backgroundColor: '#EBF8FF', borderRadius: 8,
  },
  inlinePhotoBtnText: {
    fontSize: 13, fontWeight: '600', fontFamily: 'Raleway_600SemiBold', color: '#3182CE',
  },
  inlineNoteActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  inlineSubmitBtn: { flex: 1 },
  inlineSubmitGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 14,
  },
  inlineSubmitText: { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: 'Raleway_700Bold' },
  inlineCancelBtn: { paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  inlineCancelText: { fontSize: 14, color: '#718096', fontWeight: '600', fontFamily: 'Raleway_600SemiBold' },
});
