import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, FontFamily, Shadows } from '../../theme';
import { fetchInspiration, InspirationResult } from '../../services/suggest';

export default function SuggestScreen({ navigation }: { navigation: any }) {
  const [materialInput, setMaterialInput] = useState('');
  const [materials, setMaterials] = useState<string[]>([]);
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [results, setResults] = useState<InspirationResult[]>([]);

  const addMaterial = () => {
    const trimmed = materialInput.trim();
    if (!trimmed) return;
    if (!materials.includes(trimmed)) setMaterials([...materials, trimmed]);
    setMaterialInput('');
  };
  const removeMaterial = (m: string) =>
    setMaterials(materials.filter((x) => x !== m));

  const canSubmit = materials.length > 0 && !loading;

  const onSubmit = async () => {
    setError(null);
    setNotice(null);
    setResults([]);
    setLoading(true);
    try {
      const res = await fetchInspiration(materials, theme.trim() || undefined);
      if (res.blocked) {
        setNotice(res.notice ?? 'That request can\'t be used here.');
      } else {
        setResults(res.results);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch inspiration');
    } finally {
      setLoading(false);
    }
  };

  const openInspiration = (item: InspirationResult) => {
    navigation.navigate('InspirationDetail', {
      article: item,
      materials,
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Find Inspiration</Text>
            <View style={{ width: 24 }} />
          </View>
          <Text style={styles.headerSubtitle}>
            Tell us what you have on hand. We'll find cultural traditions
            from around the world that use those materials.
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <FlatList
          data={results}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          columnWrapperStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.base }}
          contentContainerStyle={{ paddingBottom: Spacing['3xl'], gap: Spacing.sm }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.formBlock}>
              <Text style={styles.label}>Materials</Text>
              <View style={styles.materialInputRow}>
                <TextInput
                  style={styles.materialInput}
                  placeholder="e.g. clay, kiln, string"
                  placeholderTextColor={Colors.textMuted}
                  value={materialInput}
                  onChangeText={setMaterialInput}
                  onSubmitEditing={addMaterial}
                  returnKeyType="done"
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={[styles.addBtn, !materialInput.trim() && styles.addBtnDisabled]}
                  onPress={addMaterial}
                  disabled={!materialInput.trim()}
                >
                  <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              {materials.length > 0 && (
                <View style={styles.chipWrap}>
                  {materials.map((m) => (
                    <View key={m} style={styles.chip}>
                      <Text style={styles.chipText}>{m}</Text>
                      <TouchableOpacity onPress={() => removeMaterial(m)} hitSlop={6}>
                        <Ionicons name="close" size={14} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Theme (optional)</Text>
              <TextInput
                style={styles.themeInput}
                placeholder="e.g. recycling, water cycle"
                placeholderTextColor={Colors.textMuted}
                value={theme}
                onChangeText={setTheme}
              />

              <TouchableOpacity
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                onPress={onSubmit}
                disabled={!canSubmit}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <Text style={styles.submitText}>Find cultural inspiration</Text>
                  </>
                )}
              </TouchableOpacity>

              {error && (
                <View style={styles.errorCard}>
                  <Ionicons name="alert-circle" size={18} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {notice && (
                <View style={styles.noticeCard}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
                  <Text style={styles.noticeText}>{notice}</Text>
                </View>
              )}

              {results.length > 0 && (
                <Text style={styles.resultsHeading}>
                  {results.length} cultural traditions
                </Text>
              )}
            </View>
          }
          ListEmptyComponent={
            !loading && !error ? (
              <View style={styles.emptyState}>
                <Ionicons name="globe-outline" size={48} color={Colors.borderStrong} />
                <Text style={styles.emptyText}>
                  Add some materials and tap the button to discover cultural
                  crafts from around the world.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <InspirationCard item={item} onPress={() => openInspiration(item)} />
          )}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Grid card ─────────────────────────────────────────────────────────────

function InspirationCard({
  item, onPress,
}: { item: InspirationResult; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.85}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.gridImage} />
      ) : (
        <View style={[styles.gridImage, styles.gridImagePlaceholder]}>
          <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
        </View>
      )}
      <View style={styles.gridBody}>
        <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.gridFooter}>
          <Ionicons name="arrow-forward-circle" size={14} color={Colors.primary} />
          <Text style={styles.gridFooterText}>Generate activity</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  headerTitle: {
    color: Colors.textInverse, fontSize: FontSize.lg, fontWeight: '800',
    fontFamily: FontFamily.extraBold,
  },
  headerSubtitle: {
    color: Colors.textInverse, opacity: 0.92, fontSize: FontSize.sm,
    marginTop: Spacing.sm, lineHeight: FontSize.sm * 1.4,
  },

  formBlock: { padding: Spacing.base, gap: Spacing.sm },

  label: {
    fontSize: FontSize.sm, fontWeight: '700',
    color: Colors.textSecondary, marginTop: Spacing.sm,
    fontFamily: FontFamily.bold,
  },

  materialInputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  materialInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 2, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    fontSize: FontSize.base, color: Colors.textPrimary,
  },
  addBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: Colors.borderStrong },

  chipWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },

  themeInput: {
    backgroundColor: Colors.surface,
    borderWidth: 2, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    fontSize: FontSize.base, color: Colors.textPrimary,
  },

  submitBtn: {
    flexDirection: 'row', gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg, paddingVertical: Spacing.base,
    alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.md,
    ...Shadows.md,
  },
  submitBtnDisabled: { backgroundColor: Colors.borderStrong },
  submitText: {
    color: Colors.textInverse, fontSize: FontSize.md, fontWeight: '700',
    fontFamily: FontFamily.bold,
  },

  errorCard: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'center',
    backgroundColor: Colors.errorLight, padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorText: { flex: 1, color: Colors.error, fontSize: FontSize.sm },

  noticeCard: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.surfaceSecondary, padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  noticeText: {
    flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.45,
  },

  resultsHeading: {
    fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary,
    marginTop: Spacing.lg, marginBottom: 4,
    fontFamily: FontFamily.bold,
  },

  emptyState: {
    alignItems: 'center', padding: Spacing.xl, gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center',
    maxWidth: 280, lineHeight: FontSize.sm * 1.5,
  },

  gridCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  gridImage: {
    width: '100%', aspectRatio: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  gridImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  gridBody: { padding: Spacing.sm, gap: 6 },
  gridTitle: {
    fontSize: FontSize.sm, fontWeight: '700',
    color: Colors.textPrimary, fontFamily: FontFamily.bold,
    lineHeight: FontSize.sm * 1.3,
    minHeight: FontSize.sm * 1.3 * 2,
  },
  gridFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gridFooterText: {
    fontSize: 10, color: Colors.primary, fontWeight: '700',
  },
});
