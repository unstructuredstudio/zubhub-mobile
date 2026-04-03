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
import * as ImagePicker from 'expo-image-picker';
import { downloadActivityPDF, openOrSharePDF } from '../../services/download';
import { shareOnWhatsApp, shareActivity } from '../../services/share';
import { trackActivityView, trackNoteAdded } from '../../services/analytics';
import { deleteCommunityNote, addCommunityNote, deleteActivity } from '../../services/api';
import { translateActivity, translateText } from '../../services/translate';
import { useStore } from '../../store/useStore';
import { useQueryClient } from '@tanstack/react-query';
import { useCommunityNotes } from '../../hooks/useActivities';
import { CommunityNote } from '../../types';
import { Colors } from '../../theme';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
function ImageLightbox({ images, visible, initialIndex, onClose }: {
  images: string[];
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
        {images.length === 1 ? (
          <Image source={{ uri: images[0] }} style={styles.lightboxImage} resizeMode="contain" />
        ) : (
          <FlatList
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            initialScrollIndex={initialIndex}
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
  const { user, selectedLanguage, facilitationCount } = useStore();
  const queryClient = useQueryClient();

  // Image lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxVisible, setLightboxVisible] = useState(false);

  // Inline note form state
  const [noteText, setNoteText] = useState('');
  const [noteRating, setNoteRating] = useState(0);
  const [notePhotos, setNotePhotos] = useState<string[]>([]);
  const [noteLoading, setNoteLoading] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxVisible(true);
  };

  // Fetch real community notes from Firestore
  const { data: communityNotes = [] } = useCommunityNotes(activity.id);

  const handleDeleteNote = (noteId: string) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
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
    ]);
  };
  const [translatedNotes, setTranslatedNotes] = useState<CommunityNote[]>([]);

  // Stable key to detect when notes actually change (avoids reference-equality loops)
  const notesKey = communityNotes.map((n: CommunityNote) => n.id).join(',');

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
  };

  const handleWhatsApp = () => shareOnWhatsApp(activity, user?.id);
  const handleShare = () => shareActivity(activity, user?.id);

  const myFacilitationCount = facilitationCount[activity.id] || 0;

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
  const handlePickNotePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - notePhotos.length,
    });
    if (!result.canceled && result.assets) {
      setNotePhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
    }
  };

  const handleSubmitNote = async () => {
    if (noteText.trim().length < 10) {
      Alert.alert('Too short', 'Please write at least 10 characters about your experience.');
      return;
    }
    setNoteLoading(true);
    try {
      await addCommunityNote(activity.id, noteText.trim(), noteRating > 0 ? noteRating : undefined, notePhotos.length > 0 ? notePhotos : undefined);
      await trackNoteAdded(activity.id, noteRating > 0);
      queryClient.invalidateQueries({ queryKey: ['notes', activity.id] });
      setNoteText('');
      setNoteRating(0);
      setNotePhotos([]);
      setShowNoteForm(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not save note. Please try again.');
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
        images={lightboxImages}
        visible={lightboxVisible}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxVisible(false)}
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
                <TouchableOpacity onPress={handleShare}>
                  <Ionicons name="share-outline" size={24} color="#fff" />
                </TouchableOpacity>
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
              {myFacilitationCount > 0 && (
                <>
                  <Text style={styles.ratingDot}>•</Text>
                  <Ionicons name="ribbon-outline" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.ratingCount}>{myFacilitationCount} sessions</Text>
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
                <View style={styles.metaChip}>
                  <Ionicons name="person-outline" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metaChipText}>{activity.creator_name}</Text>
                </View>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          {/* Download & WhatsApp */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.downloadBtn]}
              onPress={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.actionBtnText}>{downloadPercent}%</Text>
                </>
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Download</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.whatsappBtn]}
              onPress={handleWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>WhatsApp</Text>
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

          {/* Enter Facilitation Mode CTA */}
          {activity.steps?.length > 0 && (
            <>
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
                  <Ionicons name="play" size={24} color="#fff" />
                  <Text style={styles.facilitationCTAText}>Enter Facilitation Mode</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.facilitationCTAHint}>
                Step-by-step guidance with timers and tips
              </Text>
            </>
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
                  <View style={styles.materialLeft}>
                    <Text style={styles.materialName}>{m.name}</Text>
                    {m.price && <Text style={styles.materialPrice}>{m.price}</Text>}
                  </View>
                  <View style={styles.materialRight}>
                    {m.buy_hint && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="location-outline" size={13} color="#718096" />
                        <Text style={styles.buyHint}>{m.buy_hint}</Text>
                      </View>
                    )}
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
                        <TouchableOpacity key={idx} onPress={() => openLightbox(step.images, idx)} activeOpacity={0.85}>
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

          {/* Community Notes */}
          <Section title="Community Notes">
            {translatedNotes.length === 0 && !showNoteForm && (
              <>
                <Text style={styles.noNotesText}>No community notes yet. Be the first to share your experience!</Text>
                <Text style={styles.photoPromptText}>Share photos of what participants made!</Text>
              </>
            )}
            {translatedNotes.map((note: CommunityNote) => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <View style={styles.noteAvatar}>
                    <Text style={styles.noteAvatarText}>{note.user_name?.[0] ?? '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noteUser}>{note.user_name}</Text>
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
                {note.images && note.images.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.noteImgRow}>
                    {note.images.map((uri: string, idx: number) => (
                      <TouchableOpacity key={idx} onPress={() => openLightbox(note.images!, idx)} activeOpacity={0.85}>
                        <Image source={{ uri }} style={styles.noteImg} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            ))}

            {/* Inline note form */}
            {showNoteForm ? (
              <View style={styles.inlineNoteForm}>
                <Text style={styles.inlineNoteLabel}>How did it go?</Text>
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
                <Text style={[styles.charCount, noteText.length < 10 && styles.charCountWarn]}>
                  {noteText.length} / 10 min
                </Text>

                {notePhotos.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inlinePhotoRow}>
                    {notePhotos.map((uri, index) => (
                      <View key={index} style={styles.inlinePhotoThumb}>
                        <Image source={{ uri }} style={styles.inlinePhotoImg} />
                        <TouchableOpacity
                          style={styles.inlinePhotoRemove}
                          onPress={() => setNotePhotos((prev) => prev.filter((_, i) => i !== index))}
                        >
                          <Ionicons name="close-circle" size={20} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {notePhotos.length < 5 && (
                  <TouchableOpacity style={styles.inlinePhotoBtn} onPress={handlePickNotePhoto}>
                    <Ionicons name="camera-outline" size={18} color="#3182CE" />
                    <Text style={styles.inlinePhotoBtnText}>
                      {notePhotos.length === 0 ? 'Add Photos (Optional)' : `Add More (${notePhotos.length}/5)`}
                    </Text>
                  </TouchableOpacity>
                )}
                {notePhotos.length === 0 && (
                  <Text style={styles.photoPromptText}>Share photos of what participants made!</Text>
                )}

                <View style={styles.inlineNoteActions}>
                  <TouchableOpacity
                    style={styles.inlineSubmitBtn}
                    onPress={handleSubmitNote}
                    disabled={noteLoading}
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
                          <Text style={styles.inlineSubmitText}>Publish Note</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.inlineCancelBtn}
                    onPress={() => { setShowNoteForm(false); setNoteText(''); setNoteRating(0); setNotePhotos([]); }}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
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
  actionRow: { flexDirection: 'row', gap: 12, padding: 16 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  downloadBtn: { backgroundColor: '#3182CE' },
  whatsappBtn: { backgroundColor: '#25D366' },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: 'Raleway_700Bold' },
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
  materialRight: { alignItems: 'flex-end', gap: 4 },
  buyHint: { fontSize: 11, color: '#718096', fontStyle: 'italic', flexShrink: 1 },
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
  photoPromptText: { fontSize: 12, color: '#3182CE', marginBottom: 8 },
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
  noteImgRow: { marginTop: 8 },
  noteImg: {
    width: 80, height: 60, borderRadius: 6,
    marginRight: 6, backgroundColor: '#E2E8F0',
  },
  facilitationCTA: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: 'hidden',
  },
  facilitationCTAGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
  },
  facilitationCTAText: {
    fontSize: 18, fontWeight: '900', fontFamily: 'Raleway_800ExtraBold', color: '#fff',
  },
  facilitationCTAHint: {
    fontSize: 12, color: '#718096', textAlign: 'center',
    marginTop: 8, marginHorizontal: 16,
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
  inlinePhotoRow: { marginTop: 10, marginBottom: 4 },
  inlinePhotoThumb: { position: 'relative', marginRight: 8 },
  inlinePhotoImg: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#E2E8F0' },
  inlinePhotoRemove: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#fff', borderRadius: 10,
  },
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
