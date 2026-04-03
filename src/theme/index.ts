import { StyleSheet, Platform } from 'react-native';

// ─── Color Palette ───────────────────────────────────────────────────────────

export const Colors = {
  // Brand
  primary: '#E53E3E',
  primaryDark: '#C53030',
  primaryLight: '#FC8181',
  secondary: '#ED8936',
  accent: '#FEE000',

  // Status
  success: '#38A169',
  successLight: '#C6F6D5',
  warning: '#D69E2E',
  warningLight: '#FEFCBF',
  error: '#E53E3E',
  errorLight: '#FED7D7',
  info: '#3182CE',
  infoLight: '#BEE3F8',

  // Backgrounds
  background: '#F7FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#EDF2F7',

  // Text
  textPrimary: '#1A202C',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  textInverse: '#FFFFFF',
  textOnGradient: '#FFFFFF',

  // Borders
  border: '#E2E8F0',
  borderStrong: '#CBD5E0',

  // Social
  whatsapp: '#25D366',
  whatsappDark: '#128C7E',
  download: '#3182CE',
  downloadDark: '#2C5282',

  // Gradient colors (used with expo-linear-gradient)
  gradientStart: '#E53E3E',
  gradientEnd: '#ED64A6',
  gradientStartAlt: '#F6AD55',
  gradientEndAlt: '#FC8181',

  // Misc
  overlay: 'rgba(0,0,0,0.5)',
  cardShadow: 'rgba(0,0,0,0.1)',
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────

export const FontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

// Loaded via @expo-google-fonts/raleway in App.tsx
// iOS ignores fontWeight when fontFamily is set, so each weight needs its own variant name.
export const FontFamily = {
  regular: 'Raleway_400Regular',
  medium: 'Raleway_500Medium',
  semiBold: 'Raleway_600SemiBold',
  bold: 'Raleway_700Bold',
  extraBold: 'Raleway_800ExtraBold',
} as const;

export const LineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// ─── Shadows (optimized for Android) ─────────────────────────────────────────

export const Shadows = StyleSheet.create({
  sm: {
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
    }),
  },
  md: {
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
    }),
  },
  lg: {
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },
});

// ─── Common Shared Styles ─────────────────────────────────────────────────────

export const CommonStyles = StyleSheet.create({
  flex1: { flex: 1 },
  row: { flexDirection: 'row' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
});
