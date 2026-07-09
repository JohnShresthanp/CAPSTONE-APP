import { useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { Button } from '@/shared/ui';

type ListDetail = {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  isSystem: boolean;
  systemType: string | null;
  userId: number;
  movies: Array<{
    id: string;
    movieId: string;
    addedAt: string;
    notes: string | null;
    movie: {
      id: string;
      title: string;
      posterUrl: string | null;
      tmdbRating: number | null;
    };
  }>;
  _count: { movies: number };
};

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data: list, isLoading } = useQuery({
    queryKey: ['lists', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/lists/${id}`);
      return res.data.data as ListDetail;
    },
    enabled: !!id,
  });

  const removeMovie = useMutation({
    mutationFn: async (movieId: string) => {
      await apiClient.delete(`/api/lists/${id}/movies/${movieId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lists', id] });
      qc.invalidateQueries({ queryKey: ['lists', 'mine'] });
    },
  });

  const handleRemove = (movieId: string, title: string) => {
    Alert.alert('Remove Movie', `Remove "${title}" from this list?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeMovie.mutate(movieId) },
    ]);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top, justifyContent: 'center' }}>
        <ActivityIndicator color="#D4A85C" />
      </View>
    );
  }

  if (!list) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#98989E', fontSize: 15 }}>List not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: '#F5F0EB', fontSize: 20, fontWeight: '700' }}>{list.name}</Text>
        {list.description && <Text style={{ color: '#98989E', fontSize: 13, marginTop: 4 }}>{list.description}</Text>}
        {list.isSystem && (
          <View style={{ backgroundColor: '#D4A85C20', alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 }}>
            <Text style={{ color: '#D4A85C', fontSize: 10, fontWeight: '600', textTransform: 'capitalize' }}>{list.systemType}</Text>
          </View>
        )}
      </View>

      <FlashList
        data={list.movies}
        estimatedItemSize={80}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/movie/${item.movie.id}`)}
            onLongPress={() => !list.isSystem && handleRemove(item.movieId, item.movie.title)}
            style={{ flexDirection: 'row', padding: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' }}
          >
            <View style={{ width: 50, height: 75, backgroundColor: '#3A3A3C', borderRadius: 8, overflow: 'hidden' }}>
              {item.movie.posterUrl && (
                <Image source={{ uri: item.movie.posterUrl }} style={{ flex: 1 }} contentFit="cover" />
              )}
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={{ color: '#F5F0EB', fontSize: 14, fontWeight: '600' }}>{item.movie.title}</Text>
              {item.movie.tmdbRating && (
                <Text style={{ color: '#D4A85C', fontSize: 11, marginTop: 2 }}>
                  {'★'} {item.movie.tmdbRating.toFixed(1)}
                </Text>
              )}
            </View>
            {!list.isSystem && (
              <Pressable onPress={() => handleRemove(item.movieId, item.movie.title)} style={{ justifyContent: 'center', padding: 4 }}>
                <Text style={{ color: '#FF453A', fontSize: 16 }}>{'✕'}</Text>
              </Pressable>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#98989E', fontSize: 15 }}>No movies in this list</Text>
          </View>
        }
      />
    </View>
  );
}
