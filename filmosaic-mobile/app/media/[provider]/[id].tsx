import { View, Text, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { apiClient } from '@/services/api/client';

export default function MediaDetailScreen() {
  const { provider, id } = useLocalSearchParams<{ provider: string; id: string }>();
  const insets = useSafeAreaInsets();

  const { data: media, isLoading } = useQuery({
    queryKey: ['media', provider, id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/media/${provider}/${id}`);
      return res.data.data as any;
    },
    enabled: !!provider && !!id,
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top }}>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <ActivityIndicator color="#D4A85C" />
        </View>
      ) : media ? (
        <View style={{ padding: 16, gap: 12 }}>
          {media.coverUrl && (
            <Image source={{ uri: media.coverUrl }} style={{ width: '100%', height: 200, borderRadius: 12 }} contentFit="cover" />
          )}
          <Text style={{ color: '#F5F0EB', fontSize: 20, fontWeight: '700' }}>{media.title}</Text>
          {media.description && (
            <Text style={{ color: '#F5F0EB', fontSize: 14, opacity: 0.8, lineHeight: 20 }}>{media.description}</Text>
          )}
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Text style={{ color: '#98989E', fontSize: 15 }}>Media not found</Text>
        </View>
      )}
    </ScrollView>
  );
}
