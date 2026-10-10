import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection, query, where, orderBy, getDocs, limit,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useStore } from '../../store/useStore';
import { fetchUserActivities } from '../../services/api';
import type { Activity, EngagementEventType } from '../../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NotificationItem {
  id: string;
  activityId: string;
  activityTitle: string;
  eventType: EngagementEventType;
  count: number;
  latestAt: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  view:            { icon: 'eye-outline',       color: '#3B82F6', label: 'viewed' },
  download:        { icon: 'download-outline',  color: '#10B981', label: 'downloaded' },
  share_whatsapp:  { icon: 'logo-whatsapp',     color: '#25D366', label: 'shared on WhatsApp' },
  share_other:     { icon: 'share-outline',      color: '#8B5CF6', label: 'shared' },
  add_note:        { icon: 'chatbubble-outline', color: '#F59E0B', label: 'shared an experience of' },
  // Without these two, a facilitation or a remix fell through to the `view`
  // fallback below and was reported as "viewed your activity".
  facilitate:      { icon: 'ribbon-outline',     color: '#E53E3E', label: 'facilitated' },
  remix:           { icon: 'git-branch-outline', color: '#E53E3E', label: 'remixed' },
};

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function NotificationsScreen({ navigation }: { navigation: any }) {
  const { user } = useStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }

    try {
      // 1. Get user's activities
      const activities = await fetchUserActivities(user.id);
      if (activities.length === 0) { setNotifications([]); return; }

      const activityMap = new Map<string, Activity>();
      activities.forEach((a) => activityMap.set(a.id, a));
      const activityIds = activities.map((a) => a.id);

      // 2. Query engagement_events for those activities (Firestore 'in' max 30)
      const batches: string[][] = [];
      for (let i = 0; i < activityIds.length; i += 30) {
        batches.push(activityIds.slice(i, i + 30));
      }

      const allDocs: any[] = [];
      for (const batch of batches) {
        try {
          const snapshot = await getDocs(
            query(
              collection(db, 'engagement_events'),
              where('activity_id', 'in', batch),
            ),
          );
          snapshot.docs.forEach((d) => allDocs.push(d.data()));
        } catch (queryErr: any) {
          console.error('[Notifications] query error:', queryErr.message);
        }
      }

      // 3. Filter out self-events and create_activity events
      const events = allDocs.filter(
        (e) => e.user_id !== user.id && e.event_type !== 'create_activity',
      );

      // 4. Group by (activity_id, event_type)
      const grouped = new Map<string, NotificationItem>();
      events.forEach((e) => {
        const key = `${e.activity_id}__${e.event_type}`;
        const ts = e.created_at?.toDate?.() ?? new Date();
        const activity = activityMap.get(e.activity_id);

        if (!grouped.has(key)) {
          grouped.set(key, {
            id: key,
            activityId: e.activity_id,
            activityTitle: activity?.title ?? 'Unknown Activity',
            eventType: e.event_type,
            count: 1,
            latestAt: ts,
          });
        } else {
          const existing = grouped.get(key)!;
          existing.count += 1;
          if (ts > existing.latestAt) existing.latestAt = ts;
        }
      });

      // 5. Sort by most recent
      const sorted = Array.from(grouped.values()).sort(
        (a, b) => b.latestAt.getTime() - a.latestAt.getTime(),
      );

      setNotifications(sorted);
    } catch (err) {
      console.warn('[Notifications] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const config = EVENT_CONFIG[item.eventType] ?? EVENT_CONFIG.view;
    const countText = item.count > 1 ? `${item.count} people` : 'Someone';
    const message = `${countText} ${config.label} "${item.activityTitle}"`;

    return (
      <View style={styles.notifRow}>
        <View style={[styles.iconCircle, { backgroundColor: config.color + '18' }]}>
          <Ionicons name={config.icon as any} size={20} color={config.color} />
        </View>
        <View style={styles.notifContent}>
          <Text style={styles.notifMessage} numberOfLines={2}>{message}</Text>
          <Text style={styles.notifTime}>{relativeTime(item.latestAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#E53E3E', '#ED64A6']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.headerBtn} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing || loading} onRefresh={handleRefresh} tintColor="#E53E3E" />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#E53E3E" />
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="notifications-off-outline" size={56} color="#CBD5E0" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                When educators view, download, or share your activities, you'll see it here.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 8,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', fontFamily: 'Raleway_800ExtraBold', color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#4A5568', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#A0AEC0', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  list: { padding: 16, paddingBottom: 32 },
  emptyList: { flexGrow: 1 },
  notifRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  iconCircle: {
    width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifMessage: { fontSize: 14, fontWeight: '600', color: '#1A202C', lineHeight: 20 },
  notifTime: { fontSize: 12, color: '#A0AEC0', marginTop: 2 },
});
