import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, FontFamily, Shadows } from '../../theme';
import {
  fetchActivity, GeneratedActivity, InspirationResult,
} from '../../services/suggest';

const MIN_AGE = 3;
const MAX_AGE = 18;

type RouteParams = {
  article: InspirationResult;
  materials: string[];
};

export default function InspirationDetailScreen({
  route, navigation,
}: { route: any; navigation: any }) {
  const { article, materials } = route.params as RouteParams;
  const [ageLo, setAgeLo] = useState(8);
  const [ageHi, setAgeHi] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<GeneratedActivity | null>(null);

  const generate = async () => {
    setError(null);
    setActivity(null);
    setLoading(true);
    try {
      const res = await fetchActivity(article.id, materials, [ageLo, ageHi]);
      setActivity(res.activity);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate activity');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate once on mount so the user lands on a useful result.
  useEffect(() => { generate(); }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{article.title}</Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollBody}>

        {article.image_url && (
          <Image source={{ uri: article.image_url }} style={styles.hero} />
        )}

        {article.summary && (
          <View style={styles.aboutCard}>
            <View style={styles.aboutHeader}>
              <Ionicons name="book-outline" size={16} color={Colors.primary} />
              <Text style={styles.aboutTitle}>About this tradition</Text>
            </View>
            <Text style={styles.aboutText} numberOfLines={6}>
              {article.summary}
            </Text>
            {article.url && (
              <TouchableOpacity
                style={styles.wikiBtn}
                onPress={() => article.url && Linking.openURL(article.url)}
              >
                <Ionicons name="open-outline" size={14} color={Colors.primary} />
                <Text style={styles.wikiBtnText}>Read on Wikipedia</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Age picker — affects re-generation */}
        <View style={styles.ageBlock}>
          <Text style={styles.label}>Age range</Text>
          <View style={styles.ageRow}>
            <AgeStepper
              label="From"
              value={ageLo}
              onChange={(v) => setAgeLo(Math.min(v, ageHi))}
            />
            <AgeStepper
              label="To"
              value={ageHi}
              onChange={(v) => setAgeHi(Math.max(v, ageLo))}
            />
            <TouchableOpacity
              style={[styles.regenBtn, loading && styles.regenBtnDisabled]}
              onPress={generate}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="refresh" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Generated activity */}
        {loading && !activity && (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              Generating a {article.title} activity for ages {ageLo}–{ageHi}…
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {activity && <ActivityCard activity={activity} />}

      </ScrollView>
    </View>
  );
}

// ─── Age stepper ───────────────────────────────────────────────────────────

function AgeStepper({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.stepperCol}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => onChange(Math.max(MIN_AGE, value - 1))}
          hitSlop={6}
        >
          <Ionicons name="remove" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{value}</Text>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => onChange(Math.min(MAX_AGE, value + 1))}
          hitSlop={6}
        >
          <Ionicons name="add" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Activity card ─────────────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: GeneratedActivity }) {
  return (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <Ionicons name="bulb" size={22} color={Colors.accent} />
        <Text style={styles.activityTitle}>{activity.title}</Text>
      </View>
      {activity.description && (
        <Text style={styles.activityDesc}>{activity.description}</Text>
      )}

      <View style={styles.metaRow}>
        {activity.estimated_minutes != null && (
          <Meta icon="time-outline" text={`${activity.estimated_minutes} min`} />
        )}
        {activity.category && <Meta icon="pricetag-outline" text={activity.category} />}
      </View>

      {activity.materials_used && activity.materials_used.length > 0 && (
        <Section title="Materials you'll use">
          {activity.materials_used.map((m) => <BulletItem key={m} text={m} />)}
        </Section>
      )}

      {activity.materials_missing && activity.materials_missing.length > 0 && (
        <Section title="You'll also need">
          {activity.materials_missing.map((m) => (
            <BulletItem key={m} text={m} muted />
          ))}
        </Section>
      )}

      {activity.steps && activity.steps.length > 0 && (
        <Section title="Steps">
          {activity.steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}
        </Section>
      )}

      {activity.learning_objectives && activity.learning_objectives.length > 0 && (
        <Section title="Learning objectives">
          {activity.learning_objectives.map((o) => <BulletItem key={o} text={o} />)}
        </Section>
      )}

      {activity.safety_note && (
        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.warning} />
          <Text style={styles.safetyText}>{activity.safety_note}</Text>
        </View>
      )}

      <Text style={styles.disclaimer}>
        AI-generated suggestion based on the cultural tradition above. Review
        and adapt for your context.
      </Text>
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

function BulletItem({ text, muted = false }: { text: string; muted?: boolean }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bullet, muted && { color: Colors.textMuted }]}>•</Text>
      <Text style={[styles.bulletText, muted && { color: Colors.textMuted }]}>{text}</Text>
    </View>
  );
}

function Meta({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color={Colors.textMuted} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.sm, gap: Spacing.sm,
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    color: Colors.textInverse, fontSize: FontSize.md, fontWeight: '800',
    fontFamily: FontFamily.extraBold,
  },

  scrollBody: { paddingBottom: Spacing['3xl'] },

  hero: {
    width: '100%', height: 220,
    backgroundColor: Colors.surfaceSecondary,
  },

  aboutCard: {
    margin: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  aboutHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: Spacing.sm,
  },
  aboutTitle: {
    fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
  aboutText: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  wikiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginTop: Spacing.sm,
  },
  wikiBtnText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700' },

  ageBlock: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  label: {
    fontSize: FontSize.sm, fontWeight: '700',
    color: Colors.textSecondary, marginBottom: Spacing.sm,
    fontFamily: FontFamily.bold,
  },
  ageRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' },
  stepperCol: { flex: 1 },
  stepperLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 2, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: 6, paddingVertical: 4,
  },
  stepperBtn: {
    width: 28, height: 28, borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperValue: {
    fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary,
    minWidth: 30, textAlign: 'center', fontFamily: FontFamily.bold,
  },
  regenBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  regenBtnDisabled: { opacity: 0.6 },

  loadingBlock: {
    margin: Spacing.base, padding: Spacing.lg,
    alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },

  errorCard: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'center',
    backgroundColor: Colors.errorLight, padding: Spacing.md,
    borderRadius: BorderRadius.md, margin: Spacing.base,
  },
  errorText: { flex: 1, color: Colors.error, fontSize: FontSize.sm },

  activityCard: {
    margin: Spacing.base,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.base, ...Shadows.md,
  },
  activityHeader: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  activityTitle: {
    flex: 1, fontSize: FontSize.lg, fontWeight: '800',
    color: Colors.textPrimary, fontFamily: FontFamily.extraBold,
  },
  activityDesc: {
    fontSize: FontSize.base, color: Colors.textSecondary,
    lineHeight: FontSize.base * 1.5,
  },
  metaRow: { flexDirection: 'row', gap: Spacing.base, marginTop: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },

  section: { marginTop: Spacing.base },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary,
    marginBottom: Spacing.sm, fontFamily: FontFamily.bold,
  },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 4 },
  bullet: { color: Colors.primary, fontWeight: '700', width: 12 },
  bulletText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: FontSize.sm * 1.5 },

  stepRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  stepNum: {
    width: 22, height: 22, borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  stepNumText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800' },
  stepText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: FontSize.sm * 1.55 },

  safetyCard: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.warningLight, padding: Spacing.md,
    borderRadius: BorderRadius.md, marginTop: Spacing.base,
  },
  safetyText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: FontSize.xs * 1.5 },

  disclaimer: {
    fontSize: 10, color: Colors.textMuted, fontStyle: 'italic',
    marginTop: Spacing.base, textAlign: 'center',
  },
});
