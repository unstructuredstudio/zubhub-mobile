import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  EmailAuthProvider, reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useStore } from '../../store/useStore';
import { updateUserProfile } from '../../services/api';
import { pickAndUploadImage } from '../../services/upload';

export default function EditProfileScreen({ navigation }: { navigation: any }) {
  const { user, setUser } = useStore();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [organization, setOrganization] = useState(user?.organization ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);

  // Account section
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const robohashUrl = `https://robohash.org/${encodeURIComponent(user?.id ?? user?.email ?? 'zubhub-user')}?set=set1&size=200x200&bgset=bg1`;
  const displayAvatar = avatarUrl ? avatarUrl : robohashUrl;

  const handlePickAvatar = async () => {
    setPickingImage(true);
    try {
      const url = await pickAndUploadImage();
      if (url) {
        setAvatarUrl(url);
      }
    } catch {
      Alert.alert('Error', 'Could not pick image. Please try again.');
    } finally {
      setPickingImage(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordCurrent) {
      Alert.alert('Required', 'Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Required', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) throw new Error('Not authenticated');

      const cred = EmailAuthProvider.credential(firebaseUser.email, passwordCurrent);
      await reauthenticateWithCredential(firebaseUser, cred);
      await updatePassword(firebaseUser, newPassword);

      Alert.alert('Success', 'Your password has been updated.');
      setPasswordCurrent('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.code === 'auth/wrong-password' ? 'Incorrect current password.'
        : err.code === 'auth/invalid-credential' ? 'Incorrect current password.'
        : err.code === 'auth/weak-password' ? 'Password is too weak. Use at least 6 characters.'
        : `Could not update password. ${err.message || 'Please try again.'}`;
      Alert.alert('Error', msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Full name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const updates: Record<string, string> = {
        full_name: fullName.trim(),
        organization: organization.trim(),
        bio: bio.trim(),
      };

      if (avatarUrl && avatarUrl !== user?.avatar_url) {
        updates.avatar_url = avatarUrl;
      }

      const updatedUser = await updateUserProfile(updates);
      setUser(updatedUser);
      Alert.alert('Success', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.warn('[Profile] Could not save:', err?.code ?? err?.message ?? err);
      Alert.alert('Error', 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
              <Text style={styles.headerTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? (
                  <ActivityIndicator size="small" color="#E53E3E" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: displayAvatar }} style={styles.avatar} />
              <TouchableOpacity
                style={styles.cameraOverlay}
                onPress={handlePickAvatar}
                disabled={pickingImage}
                activeOpacity={0.8}
              >
                {pickingImage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHint}>Tap the camera icon to change your photo</Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#A0AEC0"
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Organization</Text>
                <Text style={styles.optional}>Optional</Text>
              </View>
              <TextInput
                style={styles.input}
                value={organization}
                onChangeText={setOrganization}
                placeholder="School, company, or group"
                placeholderTextColor="#A0AEC0"
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Bio</Text>
                <Text style={styles.optional}>Optional</Text>
              </View>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell others about yourself..."
                placeholderTextColor="#A0AEC0"
                multiline
                textAlignVertical="top"
                maxLength={300}
              />
              <Text style={styles.charCount}>{bio.length}/300</Text>
            </View>
          </View>

          {/* Account Section */}
          <Text style={styles.sectionTitle}>Account</Text>

          {/* Change Password */}
          <View style={[styles.card, { marginBottom: 12 }]}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Change Password</Text>
              <TextInput
                style={styles.input}
                value={passwordCurrent}
                onChangeText={setPasswordCurrent}
                placeholder="Current password"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password (min 6 characters)"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.actionBtn, (!passwordCurrent || !newPassword || !confirmPassword) && styles.actionBtnDisabled]}
                onPress={handleChangePassword}
                disabled={savingPassword || !passwordCurrent || !newPassword || !confirmPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 8,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18, fontWeight: '800', fontFamily: 'Raleway_800ExtraBold', color: '#fff',
  },
  saveBtn: {
    backgroundColor: '#fff', borderRadius: 18,
    paddingHorizontal: 18, paddingVertical: 8,
    minWidth: 64, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#E53E3E',
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 100, height: 100, borderRadius: 28,
    borderWidth: 3, borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  cameraOverlay: {
    position: 'absolute', bottom: -4, right: -4,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E53E3E',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#F7FAFC',
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4,
  },
  avatarHint: { fontSize: 12, color: '#A0AEC0', marginTop: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    overflow: 'hidden',
  },
  fieldGroup: { paddingHorizontal: 16, paddingVertical: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: {
    fontSize: 13, fontWeight: '700', fontFamily: 'Raleway_700Bold',
    color: '#4A5568', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  optional: { fontSize: 11, color: '#A0AEC0', fontWeight: '500', marginBottom: 8 },
  input: {
    backgroundColor: '#F7FAFC', borderRadius: 12,
    borderWidth: 2, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1A202C',
  },
  bioInput: { minHeight: 100, maxHeight: 160 },
  charCount: { fontSize: 11, color: '#A0AEC0', textAlign: 'right', marginTop: 6 },
  divider: { height: 1, backgroundColor: '#F0F4F8', marginLeft: 16 },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', fontFamily: 'Raleway_800ExtraBold',
    color: '#1A202C', marginTop: 24, marginBottom: 10,
  },
  actionBtn: {
    backgroundColor: '#E53E3E', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
    marginTop: 12,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: 14, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#fff',
  },
});
