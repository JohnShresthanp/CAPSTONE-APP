import { useCallback, useMemo } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { usePopularMovies, useTopRatedMovies, useRecommendedMovies } from '@/features/movies';
import type { Movie } from '@/features/movies';
import { SectionHeader } from '@/shared/ui';

function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Pressable
      onPress={() => router.push(`/movie/${movie.id}` as any)}
      style={{ width: 140, marginRight: 12 }}
      accessibilityLabel={`${movie.title}, tap for details`}
      accessibilityRole="button"
    >
      <View style={{ width: 140, height: 210, backgroundColor: '#3A3A3C', borderRadius: 16, overflow: 'hidden' }}>
        {movie.posterUrl ? (
          <Image source={{ uri: movie.posterUrl }} style={{ flex: 1 }} contentFit="cover" cachePolicy="disk" />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#98989E', fontSize: 11, textAlign: 'center', padding: 8 }}>{movie.title}</Text>
          </View>
        )}
      </View>
      <Text style={{ color: '#F5F0EB', fontSize: 13, fontWeight: '500', marginTop: 8 }} numberOfLines={2}>
        {movie.title}
      </Text>
      {movie.tmdbRating ? (
        <Text style={{ color: '#D4A85C', fontSize: 11, marginTop: 2 }}>
          {'★'} {movie.tmdbRating.toFixed(1)}
        </Text>
      ) : null}
    </Pressable>
  );
}

function FilmRow({ data, loading }: { data: Movie[]; loading: boolean }) {
  if (loading) {
    return (
      <View style={{ paddingLeft: 16, height: 250, justifyContent: 'center' }}>
        <ActivityIndicator color="#D4A85C" />
      </View>
    );
  }
  return (
    <FlashList
      data={data}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      estimatedItemSize={140}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MovieCard movie={item} />}
    />
  );
}

type HomeSection = {
  key: string;
  title: string;
  data: Movie[];
  loading: boolean;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: popular, isLoading: popularLoading } = usePopularMovies();
  const { data: topRated, isLoading: topLoading } = useTopRatedMovies();
  const { data: recommended, isLoading: recLoading } = useRecommendedMovies(!!user);

  const sections = useMemo<HomeSection[]>(() => [
    ...(user ? [{ key: 'recommended', title: 'Recommended for You', data: recommended || [], loading: recLoading }] : []),
    { key: 'popular', title: 'Popular Films', data: popular || [], loading: popularLoading },
    { key: 'topRated', title: 'Top Rated', data: topRated || [], loading: topLoading },
  ], [user, popular, topRated, recommended, popularLoading, topLoading, recLoading]);

  const renderSection = useCallback(({ item }: { item: HomeSection }) => (
    <View>
      <SectionHeader title={item.title} />
      <FilmRow data={item.data} loading={item.loading} />
    </View>
  ), []);

  return (
    <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ color: '#D4A85C', fontSize: 20, fontWeight: '700', letterSpacing: 1.5 }}>
          FILMMOSAIC
        </Text>
      </View>
      <FlashList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item) => item.key}
        estimatedItemSize={300}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
