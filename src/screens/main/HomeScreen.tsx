import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ScrollView, StatusBar, Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { t } from '../../i18n';
import { useStore } from '../../store/useStore';
import { CATEGORIES, Category, Activity } from '../../types';
import { translateText } from '../../services/translate';
import { useActivitiesFeed } from '../../hooks/useActivities';
import { fetchUserActivities } from '../../services/api';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'bn', label: 'Bengali (বাংলা)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'mr', label: 'Marathi (मराठी)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'ar', label: 'Arabic (العربية)' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Mandarin (中文)' },
];

// ─── Category Gradients (fallback when no featured image) ─────────────────────

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  Art: ['#F9A8D4', '#F472B6'],
  Science: ['#60A5FA', '#818CF8'],
  Coding: ['#6EE7B7', '#34D399'],
  Circuits: ['#6EE7B7', '#34D399'],
  Engineering: ['#FCD34D', '#FBBF24'],
  Storytelling: ['#F9A8D4', '#F472B6'],
  Drama: ['#C084FC', '#F472B6'],
  Film: ['#60A5FA', '#818CF8'],
  Music: ['#C084FC', '#818CF8'],
  Nature: ['#86EFAC', '#4ADE80'],
};

const CATEGORY_ICONS: Record<string, string> = {
  Art: 'color-palette-outline',
  Science: 'flask-outline',
  Coding: 'code-slash-outline',
  Circuits: 'flash-outline',
  Engineering: 'construct-outline',
  Storytelling: 'book-outline',
  Drama: 'film-outline',
  Film: 'play-circle-outline',
  Music: 'musical-notes-outline',
  Nature: 'leaf-outline',
};

// ─── Activity Card ─────────────────────────────────────────────────────────────

const ActivityCard = React.memo(({
  item, onPress, lang, displayTitle, displayDesc,
}: {
  item: Activity;
  onPress: () => void;
  lang: string;
  displayTitle: string;
  displayDesc: string;
}) => {
  const gradient = CATEGORY_GRADIENTS[item.category ?? ''] ?? ['#E53E3E', '#ED64A6'];
  const icon = CATEGORY_ICONS[item.category ?? ''] ?? 'bulb-outline';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {item.featured_image_url ? (
        <View style={styles.cardThumbnail}>
          <Image source={{ uri: item.featured_image_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          {item.is_featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>{t('featured', lang)}</Text>
            </View>
          )}
        </View>
      ) : (
        <LinearGradient colors={gradient} style={styles.cardThumbnail}>
          <Ionicons name={icon as any} size={44} color="rgba(255,255,255,0.9)" />
          {item.is_featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>{t('featured', lang)}</Text>
            </View>
          )}
        </LinearGradient>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardMeta}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#F6AD55" />
            <Text style={styles.rating}>{item.rating ?? 0}</Text>
          </View>
          <Text style={styles.dotSep}>•</Text>
          <Ionicons name="download-outline" size={12} color="#718096" />
          <Text style={styles.usageText}>{(item.download_count ?? 0).toLocaleString()}</Text>
          <Text style={styles.dotSep}>•</Text>
          <Ionicons name="share-social-outline" size={12} color="#718096" />
          <Text style={styles.usageText}>{item.share_count ?? 0}</Text>
          {(item.facilitation_count ?? 0) > 0 && (
            <>
              <Text style={styles.dotSep}>•</Text>
              <Ionicons name="ribbon-outline" size={12} color="#718096" />
              <Text style={styles.usageText}>{item.facilitation_count} sessions</Text>
            </>
          )}
        </View>
        <Text style={styles.cardTitle}>{displayTitle}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{displayDesc}</Text>
        <View style={styles.cardTags}>
          <View style={styles.tag}>
            <Ionicons name="time-outline" size={12} color="#718096" />
            <Text style={styles.tagText}>{item.duration_minutes} {t('min', lang)}</Text>
          </View>
          <View style={styles.tag}>
            <Ionicons name="people-outline" size={12} color="#718096" />
            <Text style={styles.tagText}>{t('ages', lang)} {item.min_age}+</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { user, selectedLanguage, setLanguage, notifBadgeCount, setNotifBadgeCount, clearNotifBadge } = useStore();
  const selectedLang = selectedLanguage;
  const [searchText, setSearchText] = useState('');
  const [showLangModal, setShowLangModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [translatedCards, setTranslatedCards] = useState<Record<string, { title: string; description: string }>>({});

  // Fetch notification count
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const activities = await fetchUserActivities(user.id);
        if (activities.length === 0) return;
        const ids = activities.map((a) => a.id);
        const batches: string[][] = [];
        for (let i = 0; i < ids.length; i += 30) batches.push(ids.slice(i, i + 30));
        let count = 0;
        for (const batch of batches) {
          const snap = await getDocs(
            query(collection(db, 'engagement_events'), where('activity_id', 'in', batch)),
          );
          count += snap.docs.filter((d) => {
            const data = d.data();
            return data.user_id !== user.id && data.event_type !== 'create_activity';
          }).length;
        }
        setNotifBadgeCount(count);
      } catch {}
    })();
  }, [user?.id]);

  // Fetch real activities from Firestore
  const {
    data: feedData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useActivitiesFeed(selectedLanguage);

  const allActivities: Activity[] = feedData?.pages.flatMap((p) => p.data) ?? [];

  // Translate card titles and descriptions when language changes
  useEffect(() => {
    if (selectedLanguage === 'en' || allActivities.length === 0) {
      setTranslatedCards({});
      return;
    }
    Promise.all(
      allActivities.map(async (a) => ({
        id: a.id,
        title: await translateText(a.title, selectedLanguage),
        description: await translateText(a.description, selectedLanguage),
      }))
    ).then((results) => {
      const map: Record<string, { title: string; description: string }> = {};
      results.forEach((r) => { map[r.id] = { title: r.title, description: r.description }; });
      setTranslatedCards(map);
    }).catch(() => setTranslatedCards({}));
  }, [selectedLanguage, allActivities.length]);

  const filtered = allActivities.filter((a) => {
    const matchesSearch = !searchText.trim() ||
      a.title.toLowerCase().includes(searchText.toLowerCase()) ||
      a.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = !selectedCategory || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const currentLangLabel =
    LANGUAGES.find((l) => l.code === selectedLang)?.label ?? 'English';

  const renderListHeader = useCallback(
    () => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('activities', selectedLang)}</Text>
        <Text style={styles.sectionCount}>{filtered.length} {t('activities', selectedLang).toLowerCase()}</Text>
      </View>
    ),
    [filtered.length, selectedLang]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Fixed header — outside FlatList so search doesn't lose focus */}
      <LinearGradient
        colors={['#E53E3E', '#ED64A6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerTop}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.bellBtn} onPress={() => { clearNotifBadge(); navigation.navigate('Notifications'); }}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              {notifBadgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notifBadgeCount > 99 ? '99+' : notifBadgeCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="#718096" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchPlaceholder', selectedLang)}
              placeholderTextColor="#A0AEC0"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <TouchableOpacity
        style={styles.langBar}
        onPress={() => setShowLangModal(true)}
      >
        <Ionicons name="globe-outline" size={16} color="#718096" />
        <Text style={styles.langText}>{currentLangLabel}</Text>
        <Ionicons name="chevron-down" size={14} color="#718096" />
        <View style={styles.autoTag}>
          <Text style={styles.autoTagText}>{t('autoTranslated', selectedLang)}</Text>
        </View>
      </TouchableOpacity>

      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        contentContainerStyle={styles.categoryRowContent}
      >
        <TouchableOpacity
          style={[styles.catChip, !selectedCategory && styles.catChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.catChipText, !selectedCategory && styles.catChipTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, active && { backgroundColor: cat.color, borderColor: cat.color }]}
              onPress={() => setSelectedCategory(active ? null : cat.id)}
            >
              <Ionicons name={cat.icon as any} size={13} color={active ? '#fff' : cat.color} />
              <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{cat.id}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityCard
            item={item}
            lang={selectedLang}
            displayTitle={translatedCards[item.id]?.title ?? item.title}
            displayDesc={translatedCards[item.id]?.description ?? item.description}
            onPress={() =>
              navigation.navigate('ActivityDetail', {
                activityId: item.id,
                activity: item,
              })
            }
          />
        )}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.list}
        onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading || isFetchingNextPage ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color="#E53E3E" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Ionicons name="search" size={48} color="#CBD5E0" />
              <Text style={styles.emptyText}>
                {searchText.trim()
                  ? `${t('noActivitiesFound', selectedLang)} "${searchText}"`
                  : 'No activities yet. Create one to get started!'}
              </Text>
            </View>
          )
        }
      />

      {/* Language Modal */}
      <Modal
        visible={showLangModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLangModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('chooseLanguage', selectedLang)}</Text>
            <ScrollView>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langOption,
                    selectedLang === lang.code && styles.langOptionActive,
                  ]}
                  onPress={() => {
                    setLanguage(lang.code);
                    setShowLangModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.langOptionText,
                      selectedLang === lang.code && styles.langOptionTextActive,
                    ]}
                  >
                    {lang.label}
                  </Text>
                  {selectedLang === lang.code && (
                    <Ionicons name="checkmark" size={18} color="#E53E3E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  list: { paddingBottom: 24 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  logoImg: { height: 32, width: 130 },
  bellBtn: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FEE000',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#1A202C' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1A202C' },
  langBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  langText: { fontSize: 13, fontWeight: '600', fontFamily: 'Raleway_600SemiBold', color: '#4A5568', flex: 1 },
  autoTag: { backgroundColor: '#EDF2F7', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  autoTagText: { fontSize: 10, color: '#718096' },
  categoryRow: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexShrink: 0 },
  categoryRowContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F7FAFC',
  },
  catChipActive: { backgroundColor: '#E53E3E', borderColor: '#E53E3E' },
  catChipText: { fontSize: 12, fontWeight: '600', fontFamily: 'Raleway_600SemiBold', color: '#4A5568' },
  catChipTextActive: { color: '#fff' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', fontFamily: 'Raleway_800ExtraBold', color: '#1A202C' },
  sectionCount: { fontSize: 13, color: '#718096' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardThumbnail: {
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featuredText: { color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: 'Raleway_700Bold' },
  cardBody: { padding: 14 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontSize: 13, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#4A5568' },
  dotSep: { color: '#CBD5E0', fontSize: 12 },
  usageText: { fontSize: 12, color: '#718096' },
  cardTitle: { fontSize: 17, fontWeight: '800', fontFamily: 'Raleway_800ExtraBold', color: '#1A202C', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#4A5568', lineHeight: 19, marginBottom: 10 },
  cardTags: { flexDirection: 'row', gap: 12 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagText: { fontSize: 12, color: '#718096' },
  loadingFooter: { paddingVertical: 20, alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyText: { fontSize: 15, color: '#718096', textAlign: 'center', marginTop: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', fontFamily: 'Raleway_800ExtraBold', color: '#1A202C', marginBottom: 16 },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  langOptionActive: { backgroundColor: '#FFF5F5' },
  langOptionText: { fontSize: 15, color: '#4A5568' },
  langOptionTextActive: { color: '#E53E3E', fontWeight: '700', fontFamily: 'Raleway_700Bold' },
});
