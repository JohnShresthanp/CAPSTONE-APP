import { useMemo } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { apiClient } from '@/services/api/client';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data: person, isLoading } = useQuery({
    queryKey: ['person', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/movies/person/${id}`);
      return res.data.data as {
        id: string;
        name: string;
        profileImage: string | null;
        biography: string | null;
        birthday: string | null;
        movieCast: Array<{
          id: string;
          role: 'ACTOR' | 'DIRECTOR' | 'WRITER';
          characterName: string | null;
          movie: {
            id: string;
            title: string;
            posterUrl: string | null;
            releaseDate: string | null;
            tmdbRating: number | null;
          };
        }>;
      };
    },
    enabled: !!id,
  });

  const { acting, directing, writing } = useMemo(() => {
    const a: typeof person['movieCast'] = [];
    const d: typeof person['movieCast'] = [];
    const w: typeof person['movieCast'] = [];
    person?.movieCast?.forEach((c) => {
      if (c.role === 'ACTOR') a.push(c);
      else if (c.role === 'DIRECTOR') d.push(c);
      else if (c.role === 'WRITER') w.push(c);
    });
    return { acting: a, directing: d, writing: w };
  }, [person]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#D4A85C" />
      </View>
    );
  }

  if (!person) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#98989E', fontSize: 15 }}>Person not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top }}>
      <View style={{ padding: 16, gap: 12, alignItems: 'center' }}>
        {person.profileImage && (
          <Image
            source={{ uri: person.profileImage }}
            style={{ width: 150, height: 225, borderRadius: 16 }}
            contentFit="cover"
          />
        )}
        <Text style={{ color: '#F5F0EB', fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
          {person.name}
        </Text>
        {person.birthday && (
          <Text style={{ color: '#98989E', fontSize: 13 }}>{person.birthday.slice(0, 4)}</Text>
        )}
        {person.biography && (
          <Text style={{ color: '#F5F0EB', fontSize: 14, lineHeight: 20, opacity: 0.8 }}>
            {person.biography}
          </Text>
        )}
      </View>

      {acting.length > 0 && (
        <View style={{ paddingTop: 8 }}>
          <Text style={{ color: '#F5F0EB', fontSize: 16, fontWeight: '700', paddingHorizontal: 16, paddingBottom: 8 }}>
            Acting ({acting.length})
          </Text>
          {acting.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/movie/${c.movie.id}`)}
              style={{ flexDirection: 'row', padding: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' }}
            >
              <View style={{ width: 50, height: 75, backgroundColor: '#3A3A3C', borderRadius: 8, overflow: 'hidden' }}>
                {c.movie.posterUrl && (
                  <Image source={{ uri: c.movie.posterUrl }} style={{ flex: 1 }} contentFit="cover" />
                )}
              </View>
              <View style={{ justifyContent: 'center', flex: 1 }}>
                <Text style={{ color: '#F5F0EB', fontSize: 14, fontWeight: '600' }}>{c.movie.title}</Text>
                {c.characterName && (
                  <Text style={{ color: '#98989E', fontSize: 12 }}>as {c.characterName}</Text>
                )}
                {c.movie.tmdbRating && (
                  <Text style={{ color: '#D4A85C', fontSize: 11, marginTop: 2 }}>
                    {'★'} {c.movie.tmdbRating.toFixed(1)}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {directing.length > 0 && (
        <View style={{ paddingTop: 8 }}>
          <Text style={{ color: '#F5F0EB', fontSize: 16, fontWeight: '700', paddingHorizontal: 16, paddingBottom: 8 }}>
            Directing ({directing.length})
          </Text>
          {directing.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/movie/${c.movie.id}`)}
              style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' }}
            >
              <Text style={{ color: '#F5F0EB', fontSize: 14 }}>{c.movie.title}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
