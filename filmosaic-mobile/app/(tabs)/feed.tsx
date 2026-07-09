import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useActivityFeed } from '@/features/users';

type Activity = {
  id: string;
  activityType: string;
  actor: { username: string };
  target?: { title?: string; movieId?: string };
  createdAt: string;
};

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useActivityFeed();

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#98989E', fontSize: 15 }}>Sign in to see your feed</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top }}>
      <Text style={{ color: '#F5F0EB', fontSize: 22, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 12 }}>Feed</Text>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#D4A85C" /></View>
      ) : (
        <FlashList
          data={(data as Activity[]) || []}
          estimatedItemSize={80}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' }}
              onPress={() => item.target?.movieId && router.push(`/movie/${item.target.movieId}` as any)}
            >
              <Text style={{ color: '#F5F0EB', fontSize: 14 }}>
                <Text style={{ fontWeight: '600' }}>{item.actor.username}</Text>
                {' '}{item.activityType.toLowerCase().replace('_', ' ')}
                {item.target?.title ? <Text style={{ color: '#D4A85C' }}> {item.target.title}</Text> : null}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: '#98989E', fontSize: 15 }}>No activity yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
