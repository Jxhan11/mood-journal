import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Primary Colors
  primary: '#6366F1',      // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  
  // Secondary Colors
  secondary: '#F59E0B',    // Amber
  secondaryLight: '#FCD34D',
  secondaryDark: '#D97706',
  
  // Mood Colors
  mood: {
    1: '#EF4444',  // Red - Very sad
    2: '#F97316',  // Orange - Sad
    3: '#EAB308',  // Yellow - Neutral
    4: '#22C55E',  // Green - Happy
    5: '#8B5CF6',  // Purple - Very happy
  },
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Background Colors
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  
  // Text Colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
};

export const TYPOGRAPHY = {
  // Font Families
  fontRegular: 'System',
  fontMedium: 'System',
  fontBold: 'System',
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line Heights
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 42,
    '4xl': 48,
    '5xl': 60,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

export const BORDER_RADIUS = {
  sm: 4,
  base: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const SCREEN_DIMENSIONS = {
  width,
  height,
  isSmallScreen: width < 350,
  isMediumScreen: width >= 350 && width < 414,
  isLargeScreen: width >= 414,
};

// Mood-specific constants
export const MOOD_EMOJIS = {
  1: '😢',  // Very sad
  2: '😕',  // Sad
  3: '😐',  // Neutral
  4: '😊',  // Happy
  5: '😄',  // Very happy
};

export const MOOD_LABELS = {
  1: 'Very Sad',
  2: 'Sad',
  3: 'Neutral',
  4: 'Happy',
  5: 'Very Happy',
};

export const MOOD_DESCRIPTIONS = {
  1: 'Feeling very down or struggling',
  2: 'Having a difficult or challenging day',
  3: 'Feeling okay or neutral',
  4: 'Feeling good and positive',
  5: 'Feeling amazing and joyful',
};