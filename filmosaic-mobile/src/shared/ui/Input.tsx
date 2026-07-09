import { forwardRef } from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';
import { useUIStore } from '@/stores/uiStore';
import { spacing } from '@/theme/spacing';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, ...props }, ref) => {
    const activeTheme = useUIStore((s) => s.activeTheme);
    const isDark = activeTheme === 'dark';

    return (
      <View style={{ gap: spacing.xs }}>
        {label && (
          <Text style={{ color: isDark ? '#98989E' : '#8E8E93', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          placeholderTextColor={isDark ? '#98989E' : '#8E8E93'}
          style={{
            color: isDark ? '#F5F0EB' : '#2C2C2E',
            backgroundColor: isDark ? '#3A3A3C' : '#E3DDD5',
            borderRadius: 12,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            fontSize: 15,
            minHeight: 48,
          }}
          {...props}
        />
        {error && (
          <Text style={{ color: '#FF453A', fontSize: 12 }}>{error}</Text>
        )}
      </View>
    );
  }
);
