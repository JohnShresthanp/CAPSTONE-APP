import { View, Pressable, ViewStyle } from 'react-native';
import { useUIStore } from '@/stores/uiStore';
import { spacing } from '@/theme/spacing';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
}

export function Card({ children, onPress, style, padding = 'lg' }: CardProps) {
  const activeTheme = useUIStore((s) => s.activeTheme);
  const isDark = activeTheme === 'dark';

  const containerStyle: ViewStyle = {
    backgroundColor: isDark ? '#2C2C2E' : '#EDE8E1',
    borderRadius: 16,
    padding: spacing[padding],
    ...style,
  };

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={containerStyle} accessibilityRole="button">
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}
