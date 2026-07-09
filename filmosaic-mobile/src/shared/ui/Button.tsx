import { forwardRef } from 'react';
import { Pressable, Text, ActivityIndicator, View, ViewStyle } from 'react-native';
import { useUIStore } from '@/stores/uiStore';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export const Button = forwardRef<View, ButtonProps>(
  ({ onPress, title, variant = 'primary', loading, disabled, fullWidth, accessibilityLabel, style }, ref) => {
    const activeTheme = useUIStore((s) => s.activeTheme);
    const isDark = activeTheme === 'dark';

    const bgMap: Record<ButtonVariant, string> = {
      primary: '#D4A85C',
      secondary: isDark ? '#3A3A3C' : '#E3DDD5',
      ghost: 'transparent',
      danger: '#FF453A',
    };

    const textMap: Record<ButtonVariant, string> = {
      primary: '#1C1C1E',
      secondary: isDark ? '#F5F0EB' : '#2C2C2E',
      ghost: isDark ? '#D4A85C' : '#C8954E',
      danger: '#FFFFFF',
    };

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        disabled={disabled || loading}
        style={[{
          backgroundColor: bgMap[variant],
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 24,
          opacity: disabled || loading ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
          minWidth: 48,
        }, style]}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        {loading ? (
          <ActivityIndicator color={textMap[variant]} />
        ) : (
          <Text style={{ color: textMap[variant], fontSize: 15, fontWeight: '600' }}>{title}</Text>
        )}
      </Pressable>
    );
  }
);
