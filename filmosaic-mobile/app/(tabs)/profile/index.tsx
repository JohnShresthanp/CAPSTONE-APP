import { View, Text, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/shared/ui';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', user?.username],
    queryFn: async () => {
      if (!user?.username) return null;
      const res = await apiClient.get(`/api/users/${user.username}`);
      return res.data.data as {
        id: number;
        username: string;
        avatar_url: string | null;
        bio: string | null;
        created_at: string;
        counts: { followers: number; following: number; reviews: number; watchedMovies: number };
        recentlyWatched: Array<{ id: string; title: string; posterUrl: string | null; tmdbRating: number | null }>;
        likedMovies: Array<{ id: string; title: string; posterUrl: string | null; tmdbRating: number | null }>;
      };
    },
    enabled: !!user?.username,
  });

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text style={{ color: '#98989E', fontSize: 15, marginBottom: 16 }}>Sign in to see your profile</Text>
        <Button title="Sign In" onPress={() => router.push('/(auth)/login')} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top }}>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', height: 200 }}>
          <ActivityIndicator color="#D4A85C" />
        </View>
      ) : (
        <>
          <View style={{ padding: 16, gap: 12, alignItems: 'center' }}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={{ width: 80, height: 80, borderRadius: 40 }} contentFit="cover" />
            ) : (
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#98989E', fontSize: 28, fontWeight: '700' }}>
                  {user.username[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={{ color: '#F5F0EB', fontSize: 22, fontWeight: '700' }}>
              {profile?.username ?? user.username}
            </Text>
            {profile?.bio && <Text style={{ color: '#98989E', fontSize: 13, textAlign: 'center' }}>{profile.bio}</Text>}
            <View style={{ backgroundColor: '#D4A85C20', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ color: '#D4A85C', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>{user.role}</Text>
            </View>
          </View>

          {profile?.counts && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' }}>
              <Stat label="Reviews" value={profile.counts.reviews} />
              <Stat label="Watched" value={profile.counts.watchedMovies} />
              <Stat label="Followers" value={profile.counts.followers} />
              <Stat label="Following" value={profile.counts.following} />
            </View>
          )}

          <View style={{ padding: 16, gap: 8 }}>
            <MenuButton title="My Lists" onPress={() => router.push('/(tabs)/profile/lists' as any)} />
            <MenuButton title="Edit Profile" onPress={() => router.push('/(tabs)/profile/edit' as any)} />
            <Button
              title="Log Out"
              onPress={logout}
              variant="danger"
              style={{ marginTop: 16 }}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: '#F5F0EB', fontSize: 18, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: '#98989E', fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function MenuButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: '#2C2C2E', borderRadius: 12, padding: 16 }}
    >
      <Text style={{ color: '#F5F0EB', fontSize: 15, fontWeight: '500' }}>{title}</Text>
    </Pressable>
  );
}
