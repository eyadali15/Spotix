/**
 * Spotix Design System — Premium Light Mode
 * Navy/Blue professional palette
 */

export const Colors = {
  // Primary — Navy / Deep Blue
  primary: '#1B2A4A',
  primaryLight: '#2D4373',
  primaryDark: '#0F1B33',
  primaryFaded: 'rgba(27, 42, 74, 0.08)',
  primaryGlow: 'rgba(27, 42, 74, 0.15)',

  // Secondary — Bright Blue
  secondary: '#3B82F6',
  secondaryLight: '#60A5FA',
  secondaryFaded: 'rgba(59, 130, 246, 0.1)',
  secondaryGlow: 'rgba(59, 130, 246, 0.2)',

  // Accent — Bright Blue (same as secondary for nav)
  accent: '#3B82F6',
  accentLight: '#93C5FD',
  accentFaded: 'rgba(59, 130, 246, 0.1)',

  // Gold
  gold: '#F59E0B',
  goldFaded: 'rgba(245, 158, 11, 0.1)',

  // Backgrounds — Clean Light
  background: '#F8FAFC',
  backgroundLight: '#FFFFFF',
  backgroundCard: '#FFFFFF',
  card: '#FFFFFF',
  cardLight: '#F1F5F9',
  surface: '#F1F5F9',

  // Status
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.1)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.1)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.08)',
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.08)',

  // Text
  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  textMuted: '#CBD5E1',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocused: '#3B82F6',

  // Neutrals
  placeholder: '#94A3B8',
  disabled: '#E2E8F0',

  // Special
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(15, 23, 42, 0.2)',

  // Glass (light mode)
  glassBg: 'rgba(255, 255, 255, 0.85)',
  glassLight: 'rgba(255, 255, 255, 0.6)',
  glassBorder: 'rgba(0, 0, 0, 0.06)',
  glassHighlight: 'rgba(255, 255, 255, 0.8)',

  // Map markers
  markerAvailable: '#10B981',
  markerLimited: '#F59E0B',
  markerFull: '#EF4444',

  // Gradient stops
  gradientStart: '#1B2A4A',
  gradientMid: '#3B82F6',
  gradientEnd: '#60A5FA',
  gradientAccent: '#F59E0B',

  // Orb colors for animated background
  orb1: 'rgba(59, 130, 246, 0.12)',
  orb2: 'rgba(27, 42, 74, 0.08)',
  orb3: 'rgba(16, 185, 129, 0.08)',
};

export const Gradients = {
  primary: ['#1B2A4A', '#2D4373'],
  accent: ['#1B2A4A', '#3B82F6', '#60A5FA'],
  sunset: ['#F59E0B', '#EF4444'],
  ocean: ['#3B82F6', '#60A5FA'],
  neon: ['#10B981', '#3B82F6'],
  card: ['#FFFFFF', '#F8FAFC'],
  glass: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'],
  navy: ['#1B2A4A', '#1E3A5F'],
};

export const Spacing = {
  xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48, massive: 64,
};

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 22, xxl: 30, full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glowPink: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  glowPurple: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  glowGold: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  neumorphic: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  neumorphicInset: {
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
};
