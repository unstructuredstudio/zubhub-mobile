import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { useStore } from '../store/useStore';
import { t } from '../i18n';

/**
 * Shown before any photo of a session is picked or captured.
 *
 * This is an affirmation, not an enforced filter — nothing here inspects the
 * image. Its job is to redirect the shot before it is taken, which does more
 * than a detector could: an educator who has just read "photograph the work"
 * points the camera at the table instead of the class. The checkbox exists so
 * the choice is explicit and repeated, rather than a policy buried in settings.
 */
export default function PhotoConsentModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (source: 'camera' | 'library') => void;
}) {
  const { selectedLanguage } = useStore();
  const [confirmed, setConfirmed] = useState(false);

  // Re-arm on every open: consent is per-upload, not remembered.
  useEffect(() => {
    if (visible) setConfirmed(false);
  }, [visible]);

  const rules = [
    { icon: 'globe-outline', text: t('photoConsentVisibility', selectedLanguage) },
  ] as const;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView bounces={false}>
            <View style={styles.iconCircle}>
              <Ionicons name="camera-outline" size={26} color={Colors.primary} />
            </View>

            <Text style={styles.title}>{t('photoConsentTitle', selectedLanguage)}</Text>

            <View style={styles.rules}>
              {rules.map((rule) => (
                <View key={rule.icon} style={styles.rule}>
                  <Ionicons name={rule.icon} size={16} color={Colors.textSecondary} />
                  <Text style={styles.ruleText}>{rule.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.checkRow, confirmed && styles.checkRowOn]}
              onPress={() => setConfirmed((v) => !v)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={confirmed ? 'checkbox' : 'square-outline'}
                size={22}
                color={confirmed ? Colors.success : Colors.borderStrong}
              />
              <Text style={styles.checkText}>{t('photoConsentConfirm', selectedLanguage)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.action, !confirmed && styles.actionDisabled]}
              onPress={() => onConfirm('camera')}
              disabled={!confirmed}
              activeOpacity={0.85}
            >
              <Ionicons name="camera" size={18} color={confirmed ? '#fff' : Colors.textMuted} />
              <Text style={[styles.actionText, !confirmed && styles.actionTextDisabled]}>
                {t('photoConsentTakePhoto', selectedLanguage)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionAlt, !confirmed && styles.actionDisabled]}
              onPress={() => onConfirm('library')}
              disabled={!confirmed}
              activeOpacity={0.85}
            >
              <Ionicons name="images-outline" size={18} color={confirmed ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.actionAltText, !confirmed && styles.actionTextDisabled]}>
                {t('photoConsentChoose', selectedLanguage)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancel} onPress={onCancel}>
              <Text style={styles.cancelText}>{t('cancel', selectedLanguage)}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  iconCircle: {
    width: 52, height: 52, borderRadius: BorderRadius.full,
    backgroundColor: Colors.errorLight,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg, fontWeight: '800', fontFamily: 'Raleway_800ExtraBold',
    color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.base,
  },
  rules: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  rule: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  ruleText: {
    flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18,
  },
  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  checkRowOn: { borderColor: Colors.success, backgroundColor: Colors.successLight },
  checkText: {
    flex: 1, fontSize: FontSize.sm, fontWeight: '600',
    fontFamily: 'Raleway_600SemiBold', color: Colors.textPrimary, lineHeight: 18,
  },
  action: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
  },
  actionAlt: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 2, borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionDisabled: { opacity: 0.45 },
  actionText: {
    color: Colors.textInverse, fontSize: FontSize.md,
    fontWeight: '700', fontFamily: 'Raleway_700Bold',
  },
  actionAltText: {
    color: Colors.primary, fontSize: FontSize.base,
    fontWeight: '700', fontFamily: 'Raleway_700Bold',
  },
  actionTextDisabled: { color: Colors.textMuted },
  cancel: { paddingVertical: Spacing.md, alignItems: 'center' },
  cancelText: {
    fontSize: FontSize.base, color: Colors.textMuted,
    fontWeight: '600', fontFamily: 'Raleway_600SemiBold',
  },
});
