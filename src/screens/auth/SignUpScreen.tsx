import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signUp, signIn } from '../../services/api';
import { useStore } from '../../store/useStore';

export default function SignUpScreen({ navigation }: { navigation: any }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useStore();

  const validate = (): string | null => {
    if (!fullName.trim()) return 'Full name is required.';
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return 'Please enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    return null;
  };

  const handleSignUp = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signUp(
        email.trim().toLowerCase(),
        password,
        fullName.trim(),
        organization.trim() || undefined
      );
      const profile = await signIn(email.trim().toLowerCase(), password);
      setUser(profile);
    } catch (err: any) {
      setError(err?.message ?? 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.flex} bounces={false} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={['#E53E3E', '#ED64A6']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <SafeAreaView edges={['top']}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Join ZubHub! 🎉</Text>
            <Text style={styles.headerSub}>Create your free educator account</Text>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#C53030" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Field label="Full Name *" value={fullName} onChangeText={setFullName}
            placeholder="Jane Doe" autoCapitalize="words" />

          <Field label="Email *" value={email} onChangeText={setEmail}
            placeholder="educator@school.com" keyboardType="email-address"
            autoCapitalize="none" autoCorrect={false} />

          <View style={styles.field}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="At least 8 characters"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#A0AEC0"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#718096" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>At least 8 characters</Text>
          </View>

          <Field
            label="Organization (optional)"
            value={organization}
            onChangeText={setOrganization}
            placeholder="School, library, makerspace..."
          />

          <TouchableOpacity onPress={handleSignUp} disabled={loading} activeOpacity={0.85} style={{ marginTop: 8 }}>
            <LinearGradient
              colors={['#E53E3E', '#ED64A6']}
              style={styles.submitBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Create Account 🚀</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.switchLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, autoCapitalize, autoCorrect,
}: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
  keyboardType?: any; autoCapitalize?: any; autoCorrect?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={autoCorrect}
        placeholderTextColor="#A0AEC0"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFBEB' },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  back: { marginBottom: 16, marginTop: 8 },
  headerTitle: { fontSize: 28, fontWeight: '900', fontFamily: 'Raleway_800ExtraBold', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    margin: 16,
    marginTop: -20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 32,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FED7D7',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorText: { color: '#C53030', fontSize: 13, flex: 1 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#4A5568', marginBottom: 8 },
  hint: { fontSize: 11, color: '#718096', marginTop: 4 },
  input: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1A202C',
    backgroundColor: '#F7FAFC',
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: 'Raleway_700Bold' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { color: '#718096', fontSize: 14 },
  switchLink: { color: '#E53E3E', fontSize: 14, fontWeight: '700', fontFamily: 'Raleway_700Bold' },
});
