import { useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/shared/ui';

type Tab = 'stats' | 'users' | 'reviews';

type AdminStats = {
  totalUsers: number;
  totalMovies: number;
  moviesBySource: { TMDB: number; NEPALI: number };
  totalReviews: number;
  totalNepaliMovies: number;
  newUsersThisWeek: number;
  newReviewsThisWeek: number;
};

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('stats');

  if (!user || (user.role !== 'moderator' && user.role !== 'super_admin')) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FF453A', fontSize: 15 }}>Admin access required</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top }}>
      <Text style={{ color: '#F5F0EB', fontSize: 22, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 12 }}>Admin</Text>
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
        {(['stats', 'users', 'reviews'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
              backgroundColor: tab === t ? '#D4A85C' : '#2C2C2E',
            }}
          >
            <Text style={{ color: tab === t ? '#1C1C1E' : '#F5F0EB', fontSize: 13, fontWeight: '500', textTransform: 'capitalize' }}>
              {t === 'reviews' ? 'Flagged' : t === 'stats' ? 'Dashboard' : 'Users'}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {tab === 'stats' && <StatsPanel />}
        {tab === 'users' && <UsersPanel />}
        {tab === 'reviews' && <FlaggedReviewsPanel />}
      </ScrollView>
    </View>
  );
}

function StatsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/api/admin/stats');
      return res.data.data as AdminStats;
    },
  });

  if (isLoading) return <ActivityIndicator color="#D4A85C" />;
  if (!data) return <Text style={{ color: '#98989E' }}>No stats available</Text>;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {[
        { label: 'Users', value: data.totalUsers },
        { label: 'Movies', value: data.totalMovies },
        { label: 'TMDB', value: data.moviesBySource.TMDB },
        { label: 'Nepali', value: data.moviesBySource.NEPALI },
        { label: 'Reviews', value: data.totalReviews },
        { label: 'New Users/Week', value: data.newUsersThisWeek },
        { label: 'New Reviews/Week', value: data.newReviewsThisWeek },
      ].map((s) => (
        <View key={s.label} style={{ backgroundColor: '#2C2C2E', borderRadius: 12, padding: 16, minWidth: 100, flex: 1 }}>
          <Text style={{ color: '#98989E', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
          <Text style={{ color: '#F5F0EB', fontSize: 24, fontWeight: '700', marginTop: 4 }}>{s.value}</Text>
        </View>
      ))}
    </View>
  );
}

function UsersPanel() {
  const qc = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await apiClient.get('/api/admin/users');
      return res.data.data?.data ?? res.data.data ?? [];
    },
  });

  const banUser = useMutation({
    mutationFn: async (userId: number) => {
      await apiClient.delete(`/api/admin/users/${userId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const unbanUser = useMutation({
    mutationFn: async (userId: number) => {
      await apiClient.put(`/api/admin/users/${userId}/unban`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      await apiClient.put(`/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  if (isLoading) return <ActivityIndicator color="#D4A85C" />;

  return (
    <View style={{ gap: 8 }}>
      {(users as any[])?.map((u: any) => (
        <View key={u.id} style={{ backgroundColor: '#2C2C2E', borderRadius: 12, padding: 16, gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#F5F0EB', fontSize: 15, fontWeight: '600' }}>{u.username}</Text>
            <Text style={{ color: '#98989E', fontSize: 12 }}>{u.email}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: '#D4A85C20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
              <Text style={{ color: '#D4A85C', fontSize: 10, textTransform: 'capitalize' }}>{u.role}</Text>
            </View>
            {u.isBanned && (
              <View style={{ backgroundColor: '#FF453A20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ color: '#FF453A', fontSize: 10 }}>Banned</Text>
              </View>
            )}
            <Text style={{ color: '#98989E', fontSize: 11 }}>{u._count?.reviews ?? 0} reviews</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
            {u.isBanned ? (
              <Button title="Unban" variant="secondary" onPress={() => unbanUser.mutate(u.id)} style={{ flex: 1 }} />
            ) : (
              <Button title="Ban" variant="danger" onPress={() => Alert.alert('Ban User', `Ban ${u.username}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Ban', style: 'destructive', onPress: () => banUser.mutate(u.id) }])} style={{ flex: 1 }} />
            )}
            {u.role !== 'super_admin' && (
              <Button
                title={u.role === 'user' ? 'Make Mod' : 'Demote'}
                variant="secondary"
                onPress={() => updateRole.mutate({ userId: u.id, role: u.role === 'user' ? 'moderator' : 'user' })}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

function FlaggedReviewsPanel() {
  const qc = useQueryClient();
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', 'flagged'],
    queryFn: async () => {
      const res = await apiClient.get('/api/admin/reviews/flagged');
      return res.data.data ?? [];
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/admin/reviews/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reviews', 'flagged'] }),
  });

  if (isLoading) return <ActivityIndicator color="#D4A85C" />;

  return (
    <View style={{ gap: 8 }}>
      {(reviews as any[])?.length === 0 && (
        <Text style={{ color: '#98989E', textAlign: 'center', padding: 40 }}>No flagged reviews</Text>
      )}
      {(reviews as any[])?.map((r: any) => (
        <View key={r.id} style={{ backgroundColor: '#2C2C2E', borderRadius: 12, padding: 16, gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#F5F0EB', fontSize: 13, fontWeight: '600' }}>{r.user?.username}</Text>
            <Text style={{ color: '#D4A85C', fontSize: 12 }}>{'★'.repeat(Math.round(r.rating))}</Text>
          </View>
          {r.body && <Text style={{ color: '#98989E', fontSize: 13 }} numberOfLines={3}>{r.body}</Text>}
          <Text style={{ color: '#98989E', fontSize: 11 }}>{r.movie?.title}</Text>
          <Button title="Delete Review" variant="danger" onPress={() => Alert.alert('Delete', `Delete this review?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteReview.mutate(r.id) }])} />
        </View>
      ))}
    </View>
  );
}
