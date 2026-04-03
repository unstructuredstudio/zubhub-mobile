import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES, Category, Activity } from '../../types';
import { useStore } from '../../store/useStore';
import { t } from '../../i18n';
import { translateText } from '../../services/translate';
import { useActivitiesFeed } from '../../hooks/useActivities';

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

export default function SearchScreen({ navigation }: { navigation: any }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const inputRef = useRef<TextInput>(null);
  const { selectedLanguage } = useStore();
  const [translatedCards, setTranslatedCards] = useState<Record<string, { title: string; description: string }>>({});

  const { data: feedData, isLoading } = useActivitiesFeed(selectedLanguage);
  const allActivities: Activity[] = feedData?.pages?.flatMap((p) => p.data) ?? [];

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedLanguage === 'en' || allActivities.length === 0) { setTranslatedCards({}); return; }
    let cancelled = false;
    Promise.all(
      allActivities.map(async (a) => ({
        id: a.id,
        title: await translateText(a.title, selectedLanguage),
        description: await translateText(a.description, selectedLanguage),
      }))
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, { title: string; description: string }> = {};
      results.forEach((r) => { map[r.id] = { title: r.title, description: r.description }; });
      setTranslatedCards(map);
    }).catch(() => { if (!cancelled) setTranslatedCards({}); });
    return () => { cancelled = true; };
  }, [selectedLanguage, allActivities.length]);

  const filtered = allActivities.filter((a) => {
    const matchesQuery = query.trim().length < 1 || (
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.description.toLowerCase().includes(query.toLowerCase()) ||
      (a.tags ?? []).some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    const matchesCategory = !selectedCategory || a.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const navigateToActivity = (item: Activity) => {
    navigation.navigate('HomeTab', {
      screen: 'ActivityDetail',
      params: { activityId: item.id, activity: item },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#E53E3E', '#ED64A6']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.headerTitle}>{t('search', selectedLanguage)}</Text>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="#718096" style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={t('searchPlaceholder', selectedLanguage)}
              placeholderTextColor="#A0AEC0"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              blurOnSubmit={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color="#718096" />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Category chips */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.catRow} contentContainerStyle={styles.catRowContent}
      >
        <TouchableOpacity
          style={[styles.catChip, !selectedCategory && styles.catChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.catChipText, !selectedCategory && styles.catChipTextActive]}>{t('all', selectedLanguage)}</Text>
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
              <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{t('cat_' + cat.id, selectedLanguage)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color="#E53E3E" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search" size={56} color="#CBD5E0" />
          <Text style={styles.emptyTitle}>{t('noResults', selectedLanguage)}</Text>
          <Text style={styles.emptyDesc}>{t('tryDifferent', selectedLanguage)}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <SearchResultCard
              item={item}
              onPress={() => navigateToActivity(item)}
              displayTitle={translatedCards[item.id]?.title}
              displayDesc={translatedCards[item.id]?.description}
            />
          )}
        />
      )}
    </View>
  );
}

function SearchResultCard({ item, onPress, displayTitle, displayDesc }: {
  item: Activity; onPress: () => void; displayTitle?: string; displayDesc?: string;
}) {
  const cat = item.category ?? 'Art';
  const gradient = CATEGORY_GRADIENTS[cat] ?? ['#60A5FA', '#818CF8'];
  const icon = CATEGORY_ICONS[cat] ?? 'bulb-outline';

  return (
    <TouchableOpacity style={styles.resultCard} onPress={onPress} activeOpacity={0.85}>
      {item.featured_image_url ? (
        <Image source={{ uri: item.featured_image_url }} style={styles.resultThumb} />
      ) : (
        <LinearGradient colors={gradient} style={styles.resultThumb}>
          <Ionicons name={icon as any} size={28} color="rgba(255,255,255,0.9)" />
        </LinearGradient>
      )}
      <View style={styles.resultBody}>
        <Text style={styles.resultTitle} numberOfLines={1}>{displayTitle ?? item.title}</Text>
        <Text style={styles.resultDesc} numberOfLines={2}>{displayDesc ?? item.description}</Text>
        <View style={styles.resultMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={11} color="#F6AD55" />
            <Text style={styles.metaText}>{item.rating ?? 0}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={11} color="#718096" />
            <Text style={styles.metaText}>{item.duration_minutes} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={11} color="#718096" />
            <Text style={styles.metaText}>Ages {item.min_age}+</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="download-outline" size={11} color="#718096" />
            <Text style={styles.metaText}>{item.download_count ?? 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800', fontFamily: 'Raleway_800ExtraBold', color: '#fff', marginTop: 8, marginBottom: 8 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1A202C' },
  list: { padding: 16 },
  catRow: { flexShrink: 0, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  catRowContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F7FAFC',
  },
  catChipActive: { backgroundColor: '#E53E3E', borderColor: '#E53E3E' },
  catChipText: { fontSize: 12, fontWeight: '600', fontFamily: 'Raleway_600SemiBold', color: '#4A5568' },
  catChipTextActive: { color: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#4A5568', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#718096', marginTop: 4 },
  resultCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
    marginBottom: 10, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  resultThumb: { width: 80, alignItems: 'center', justifyContent: 'center' },
  resultBody: { flex: 1, padding: 12 },
  resultTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#1A202C', marginBottom: 3 },
  resultDesc: { fontSize: 12, color: '#718096', lineHeight: 17, marginBottom: 8 },
  resultMeta: { flexDirection: 'row', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: '#718096' },
});
