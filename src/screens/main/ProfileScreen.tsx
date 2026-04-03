import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { t } from '../../i18n';
import { translateText } from '../../services/translate';
import { fetchUserActivities, fetchActivity, signOut } from '../../services/api';
import type { Activity } from '../../types';

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

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const { user, signOut: storeSignOut, selectedLanguage, setLanguage } = useStore();
  const [showLangModal, setShowLangModal] = useState(false);
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [translatedTitles, setTranslatedTitles] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch this user's activities on mount
  useEffect(() => {
    if (!user?.id) return;
    fetchUserActivities(user.id).then(setMyActivities).catch(() => {});
  }, [user?.id]);

  // Translate activity titles when language changes
  useEffect(() => {
    if (selectedLanguage === 'en' || myActivities.length === 0) { setTranslatedTitles({}); return; }
    Promise.all(
      myActivities.map(async (a) => ({ id: a.id, title: await translateText(a.title, selectedLanguage) }))
    ).then((results) => {
      const map: Record<string, string> = {};
      results.forEach((r) => { map[r.id] = r.title; });
      setTranslatedTitles(map);
    }).catch(() => setTranslatedTitles({}));
  }, [selectedLanguage, myActivities]);

  const handleEditActivity = async (actId: string) => {
    setEditingId(actId);
    try {
      const full = await fetchActivity(actId);
      navigation.navigate('CreateTab', {
        screen: 'ReviewActivity',
        params: { activity: full },
      });
    } catch {
      Alert.alert('Error', 'Could not load activity for editing. Please try again.');
    } finally {
      setEditingId(null);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch {
            // ignore
          }
          storeSignOut();
        },
      },
    ]);
  };

  const displayName = user?.full_name ?? 'Educator';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const currentLangLabel = LANGUAGES.find((l) => l.code === selectedLanguage)?.label ?? 'English';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#E53E3E', '#ED64A6']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <SafeAreaView edges={['top']}>
            <View style={styles.profileRow}>
              {/* Robohash avatar — unique robot image seeded by user id/email */}
              <Image
                source={{ uri: `https://robohash.org/${encodeURIComponent(user?.id ?? user?.email ?? 'zubhub-user')}?set=set1&size=200x200&bgset=bg1` }}
                style={styles.avatar}
                defaultSource={{ uri: 'https://robohash.org/default?set=set1&size=200x200' }}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{displayName}</Text>
                {user?.organization ? (
                  <Text style={styles.profileOrg}>{user.organization}</Text>
                ) : null}
                {user?.bio ? (
                  <Text style={styles.profileBio}>{user.bio}</Text>
                ) : (
                  <Text style={styles.profileTagline}>🌍 ZubHub Educator</Text>
                )}
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
                <Ionicons name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Ionicons name="rocket-outline" size={18} color="rgba(255,255,255,0.7)" style={{ marginBottom: 2 }} />
                <Text style={styles.statValue}>{myActivities.length}</Text>
                <Text style={styles.statLabel}>{t('activitiesShared', selectedLanguage)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Ionicons name="download-outline" size={18} color="rgba(255,255,255,0.7)" style={{ marginBottom: 2 }} />
                <Text style={styles.statValue}>
                  {myActivities.reduce((sum, a) => sum + (a.download_count ?? 0), 0)}
                </Text>
                <Text style={styles.statLabel}>{t('downloadsByEducators', selectedLanguage)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Ionicons name="ribbon-outline" size={18} color="rgba(255,255,255,0.7)" style={{ marginBottom: 2 }} />
                <Text style={styles.statValue}>
                  {myActivities.reduce((sum, a) => sum + (a.facilitation_count ?? 0), 0)}
                </Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          {/* My Activities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('myActivities', selectedLanguage)}</Text>
            {myActivities.length === 0 && (
              <Text style={styles.emptyActivities}>No activities yet — create one from the Create tab!</Text>
            )}
            {myActivities.map((act) => (
              <View key={act.id} style={styles.activityRow}>
                <TouchableOpacity
                  style={styles.activityInfo}
                  onPress={() => navigation.navigate('HomeTab', {
                    screen: 'ActivityDetail',
                    params: { activityId: act.id, activity: act },
                  })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.activityTitle}>{translatedTitles[act.id] ?? act.title}</Text>
                  <View style={styles.activityMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={11} color="#F6AD55" />
                      <Text style={styles.metaText}>{act.rating}</Text>
                    </View>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText}>{act.download_count} {t('downloads', selectedLanguage)}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaText}>{act.share_count} {t('shares', selectedLanguage)}</Text>
                    {(act.facilitation_count ?? 0) > 0 && (
                      <>
                        <Text style={styles.metaDot}>•</Text>
                        <View style={styles.metaItem}>
                          <Ionicons name="ribbon-outline" size={11} color="#E53E3E" />
                          <Text style={styles.metaText}>{act.facilitation_count} sessions</Text>
                        </View>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editActivityBtn}
                  onPress={() => handleEditActivity(act.id)}
                  disabled={editingId === act.id}
                >
                  {editingId === act.id ? (
                    <ActivityIndicator size="small" color="#718096" />
                  ) : (
                    <Ionicons name="create-outline" size={18} color="#718096" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('HomeTab', {
                    screen: 'ActivityDetail',
                    params: { activityId: act.id, activity: act },
                  })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-forward" size={18} color="#CBD5E0" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings', selectedLanguage)}</Text>
            <View style={styles.settingsCard}>
              <SettingsRow
                icon="person-outline"
                label={t('editProfile', selectedLanguage)}
                onPress={() => navigation.navigate('EditProfile')}
              />
              <View style={styles.divider} />
              <SettingsRow
                icon="globe-outline"
                label={t('languagePreferences', selectedLanguage)}
                value={currentLangLabel}
                onPress={() => setShowLangModal(true)}
              />
              <View style={styles.divider} />
              <SettingsRow
                icon="notifications-outline"
                label={t('notifications', selectedLanguage)}
                onPress={() => navigation.navigate('Notifications')}
              />
              <View style={styles.divider} />
              <SettingsRow
                icon="information-circle-outline"
                label={t('aboutZubHub', selectedLanguage)}
                onPress={() => {}}
              />
              <View style={styles.divider} />
              <TouchableOpacity style={styles.settingsRow} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={20} color="#E53E3E" />
                <Text style={[styles.settingsLabel, styles.signOutText]}>{t('signOut', selectedLanguage)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.version}>ZubHub v1.0.0 • Open Source</Text>
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={showLangModal} animationType="slide" transparent onRequestClose={() => setShowLangModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('languagePreferences', selectedLanguage)}</Text>
            <ScrollView>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langOption, selectedLanguage === lang.code && styles.langOptionActive]}
                  onPress={() => {
                    setLanguage(lang.code);
                    setShowLangModal(false);
                  }}
                >
                  <Text style={[styles.langOptionText, selectedLanguage === lang.code && styles.langOptionTextActive]}>
                    {lang.label}
                  </Text>
                  {selectedLanguage === lang.code && (
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

function SettingsRow({
  icon, label, value, onPress,
}: {
  icon: any; label: string; value?: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#718096" />
      <Text style={styles.settingsLabel}>{label}</Text>
      {value && <Text style={styles.settingsValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color="#CBD5E0" style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, marginBottom: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: 20,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 22, fontWeight: '900', fontFamily: 'Raleway_800ExtraBold', color: '#fff' },
  profileOrg: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  profileTagline: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  profileBio: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 17 },
  editBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16, overflow: 'hidden',
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4 },
  statValue: { fontSize: 24, fontWeight: '900', fontFamily: 'Raleway_800ExtraBold', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  body: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', fontFamily: 'Raleway_800ExtraBold', color: '#1A202C', marginBottom: 10 },
  activityRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    gap: 8,
  },
  activityInfo: { flex: 1 },
  editActivityBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyActivities: { fontSize: 13, color: '#A0AEC0', fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
  activityTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#1A202C', marginBottom: 4 },
  activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaText: { fontSize: 12, color: '#718096' },
  metaDot: { color: '#CBD5E0', fontSize: 12 },
  settingsCard: {
    backgroundColor: '#fff', borderRadius: 14,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    overflow: 'hidden',
  },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  settingsLabel: { fontSize: 15, color: '#1A202C', fontWeight: '500', fontFamily: 'Raleway_500Medium', flex: 1 },
  settingsValue: { fontSize: 13, color: '#718096' },
  signOutText: { color: '#E53E3E', fontWeight: '600', fontFamily: 'Raleway_600SemiBold' },
  divider: { height: 1, backgroundColor: '#F0F4F8', marginLeft: 50 },
  version: { textAlign: 'center', fontSize: 12, color: '#CBD5E0', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '70%',
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', fontFamily: 'Raleway_800ExtraBold', color: '#1A202C', marginBottom: 16 },
  langOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#F0F4F8',
  },
  langOptionActive: { backgroundColor: '#FFF5F5' },
  langOptionText: { fontSize: 15, color: '#4A5568' },
  langOptionTextActive: { color: '#E53E3E', fontWeight: '700', fontFamily: 'Raleway_700Bold' },
});
