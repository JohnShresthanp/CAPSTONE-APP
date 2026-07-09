import { useMemo } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useMovieDetail, useSimilarMovies } from '@/features/movies';
import { useMovieReviews } from '@/features/reviews/api/useReviews';
import { SectionHeader, Button } from '@/shared/ui';
import { useAuthStore } from '@/stores/authStore';

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: movie, isLoading } = useMovieDetail(id ?? '');
  const { data: reviews } = useMovieReviews(id ?? '');
  const { data: similar } = useSimilarMovies(id ?? '');

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#D4A85C" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#98989E', fontSize: 15 }}>Movie not found</Text>
      </View>
    );
  }

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top }}>
      {movie.backdropUrl && (
        <Image source={{ uri: movie.backdropUrl }} style={{ width: '100%', height: 220 }} contentFit="cover" cachePolicy="disk" />
      )}
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ color: '#F5F0EB', fontSize: 24, fontWeight: '700' }}>{movie.title}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {movie.releaseDate && (
            <Text style={{ color: '#98989E', fontSize: 14 }}>{movie.releaseDate.slice(0, 4)}</Text>
          )}
          {movie.runtime && (
            <Text style={{ color: '#98989E', fontSize: 14 }}>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</Text>
          )}
          {movie.language && (
            <Text style={{ color: '#98989E', fontSize: 14 }}>{movie.language.toUpperCase()}</Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {movie.tmdbRating && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#D4A85C', fontSize: 18 }}>{'★'}</Text>
              <Text style={{ color: '#F5F0EB', fontSize: 16, fontWeight: '600' }}>{movie.tmdbRating.toFixed(1)}</Text>
            </View>
          )}
          {avgRating && (
            <Text style={{ color: '#98989E', fontSize: 13 }}>User rating: {avgRating.toFixed(1)}</Text>
          )}
        </View>

        {movie.genres?.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {movie.genres.map((g: string) => (
              <View key={g} style={{ backgroundColor: '#D4A85C20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: '#D4A85C', fontSize: 11, fontWeight: '500' }}>{g}</Text>
              </View>
            ))}
          </View>
        )}

        {movie.description && (
          <Text style={{ color: '#F5F0EB', fontSize: 14, lineHeight: 20, opacity: 0.8 }}>{movie.description}</Text>
        )}

        {user && (
          <Button
            title="Write a Review"
            onPress={() => router.push(`/modal/review-form?movieId=${movie.id}` as any)}
            variant="primary"
            fullWidth
          />
        )}
      </View>

      {reviews && reviews.length > 0 && (
        <View style={{ paddingTop: 8 }}>
          <SectionHeader title="Reviews" action={reviews.length > 3 ? { label: 'See All', onPress: () => {} } : undefined} />
          {reviews.slice(0, 3).map((review) => (
            <Pressable
              key={review.id}
              onPress={() => router.push(`/review/${review.id}` as any)}
              style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{ color: '#F5F0EB', fontSize: 13, fontWeight: '600' }}>{review.user?.username ?? 'Anonymous'}</Text>
                <Text style={{ color: '#D4A85C', fontSize: 12 }}>{'★'.repeat(Math.round(review.rating))}</Text>
              </View>
              {review.body && (
                <Text style={{ color: '#98989E', fontSize: 13, lineHeight: 18 }} numberOfLines={3}>{review.body}</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}

      {similar && similar.length > 0 && (
        <View style={{ paddingTop: 8, paddingBottom: 32 }}>
          <SectionHeader title="Similar Movies" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {similar.slice(0, 8).map((m) => (
              <Pressable key={m.id} onPress={() => router.replace(`/movie/${m.id}` as any)} style={{ width: 100, gap: 4 }}>
                <View style={{ width: 100, height: 150, backgroundColor: '#3A3A3C', borderRadius: 12, overflow: 'hidden' }}>
                  {m.posterUrl ? (
                    <Image source={{ uri: m.posterUrl }} style={{ flex: 1 }} contentFit="cover" cachePolicy="disk" />
                  ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#98989E', fontSize: 9, textAlign: 'center', padding: 4 }}>{m.title}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: '#F5F0EB', fontSize: 11, fontWeight: '500' }} numberOfLines={2}>{m.title}</Text>
                {m.tmdbRating && <Text style={{ color: '#D4A85C', fontSize: 10 }}>{m.tmdbRating.toFixed(1)}</Text>}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}
