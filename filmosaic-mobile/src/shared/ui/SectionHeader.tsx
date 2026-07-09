import { View, Text, Pressable } from 'react-native';
import { useUIStore } from '@/stores/uiStore';

interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  const activeTheme = useUIStore((s) => s.activeTheme);
  const isDark = activeTheme === 'dark';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
      <Text style={{ color: isDark ? '#F5F0EB' : '#2C2C2E', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 }}>
        {title}
      </Text>
      {action && (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text style={{ color: isDark ? '#D4A85C' : '#C8954E', fontSize: 13, fontWeight: '600' }}>
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
