import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserActivities, useUserSessionCount } from '../../hooks/useActivities';
import { Activity } from '../../types';
import { Colors } from '../../theme';

/** Same seeded robot avatar the own-profile screen uses, so a face is stable. */
function avatarUri(userId: string) {
  return `https://robohash.org/${encodeURIComponent(userId)}?set=set1&size=200x200&bgset=bg1`;
}

/**
 * Another educator's public profile: who they are and what they have written.
 *
 * Read-only by design. Editing, sign-out and language settings belong to the
 * profile tab, which is only ever the signed-in user's own.
 */
export default function EducatorProfileScreen({ route, navigation }: { route: any; navigation: any }) {
  const { userId, name, organization, bio } = route.params ?? {};
  const { data: activities = [], isLoading } = useUserActivities(userId);
  // Sessions this educator has RUN -- the same thing the "Educators Who Ran
  // This" card counts. Summing facilitation_count over the activities they
  // wrote answers a different question and showed 0 for anyone who only runs
  // other people's activities.
  const { data: sessionsRun = 0 } = useUserSessionCount(userId);

  if (!userId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Educator not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <SafeAreaView edges={['top']}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.profileRow}>
              <Image source={{ uri: avatarUri(userId) }} style={styles.avatar} />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{name || 'ZubHub Educator'}</Text>
                {organization ? <Text style={styles.profileOrg}>{organization}</Text> : null}
                {bio ? (
                  <Text style={styles.profileBio} numberOfLines={3}>{bio}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{activities.length}</Text>
                <Text style={styles.statLabel}>activities written</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{sessionsRun}</Text>
                <Text style={styles.statLabel}>sessions run</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Activities</Text>

          {isLoading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />}

          {!isLoading && activities.length === 0 && (
            <Text style={styles.muted}>This educator hasn't published an activity yet.</Text>
          )}

          {activities.map((act: Activity) => (
            <TouchableOpacity
              key={act.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() =>
                navigation.push('ActivityDetail', { activityId: act.id, activity: act })
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={2}>{act.title}</Text>
                <View style={styles.cardMeta}>
                  <Ionicons name="time-outline" size={12} color="#718096" />
                  <Text style={styles.cardMetaText}>{act.duration_minutes} min</Text>
                  {(act.facilitation_count ?? 0) > 0 && (
                    <>
                      <Text style={styles.dot}>•</Text>
                      <Ionicons name="ribbon-outline" size={12} color="#718096" />
                      <Text style={styles.cardMetaText}>
                        {act.facilitation_count} session{act.facilitation_count === 1 ? '' : 's'}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E0" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  back: { marginTop: 8, marginBottom: 12 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 19, fontWeight: '800',
    fontFamily: 'Raleway_800ExtraBold', color: '#fff',
  },
  profileOrg: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  profileBio: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 18, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 20, fontWeight: '800',
    fontFamily: 'Raleway_800ExtraBold', color: '#fff',
  },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
  body: { padding: 16 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: Colors.textPrimary, marginBottom: 10,
  },
  muted: { fontSize: 13, color: '#A0AEC0', fontStyle: 'italic' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
    padding: 14, marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14, fontWeight: '700',
    fontFamily: 'Raleway_700Bold', color: Colors.textPrimary,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  cardMetaText: { fontSize: 12, color: '#718096' },
  dot: { color: '#CBD5E0', fontSize: 12, marginHorizontal: 2 },
});
