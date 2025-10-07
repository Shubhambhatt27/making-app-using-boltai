// Color palette for the Health Scanner app

export const Colors = {
  // Primary colors
  primary: '#10B981',      // Emerald green - represents health and nature
  primaryDark: '#059669',  // Darker shade for pressed states
  primaryLight: '#A7F3D0', // Light shade for backgrounds
  
  // Secondary colors
  secondary: '#3B82F6',    // Blue - represents trust and technology
  secondaryDark: '#2563EB',
  secondaryLight: '#DBEAFE',
  
  // Accent colors
  accent: '#F59E0B',       // Amber - represents caution/warning
  accentDark: '#D97706',
  accentLight: '#FEF3C7',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral colors
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  black: '#000000',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Background colors
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',
};

// Health score color mapping
export const getHealthScoreColor = (score: number): string => {
  if (score >= 8) return Colors.success;
  if (score >= 6) return Colors.warning;
  return Colors.error;
};

export default Colors;