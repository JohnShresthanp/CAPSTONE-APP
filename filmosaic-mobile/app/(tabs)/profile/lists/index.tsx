import { useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, TextInput, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/shared/ui';

type MovieList = {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  isSystem: boolean;
  systemType: string | null;
  _count?: { movies: number };
};

export default function MyListsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { data: lists, isLoading } = useQuery({
    queryKey: ['lists', 'mine'],
    queryFn: async () => {
      const res = await apiClient.get('/api/lists');
      return res.data.data as MovieList[];
    },
    enabled: !!user,
  });

  const createList = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiClient.post('/api/lists', data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lists', 'mine'] });
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
    },
  });

  const deleteList = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/lists/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lists', 'mine'] });
    },
  });

  const handleDelete = (list: MovieList) => {
    if (list.isSystem) {
      Alert.alert('Cannot Delete', 'System lists cannot be deleted');
      return;
    }
    Alert.alert('Delete List', `Delete "${list.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteList.mutate(list.id) },
    ]);
  };

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#98989E', fontSize: 15 }}>Sign in to see your lists</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ color: '#F5F0EB', fontSize: 20, fontWeight: '700' }}>My Lists</Text>
        <Pressable onPress={() => setShowCreate(true)} style={{ backgroundColor: '#D4A85C', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 }}>
          <Text style={{ color: '#1C1C1E', fontSize: 13, fontWeight: '600' }}>+ New</Text>
        </Pressable>
      </View>

      <Modal visible={showCreate} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#00000080', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#2C2C2E', borderRadius: 16, padding: 20, gap: 12 }}>
            <Text style={{ color: '#F5F0EB', fontSize: 17, fontWeight: '700' }}>New List</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="List name"
              placeholderTextColor="#98989E"
              style={{ color: '#F5F0EB', fontSize: 14, backgroundColor: '#3A3A3C', borderRadius: 8, padding: 12 }}
            />
            <TextInput
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Description (optional)"
              placeholderTextColor="#98989E"
              style={{ color: '#F5F0EB', fontSize: 14, backgroundColor: '#3A3A3C', borderRadius: 8, padding: 12 }}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Cancel" variant="secondary" onPress={() => setShowCreate(false)} style={{ flex: 1 }} />
              <Button
                title="Create"
                onPress={() => createList.mutate({ name: newName.trim(), description: newDesc.trim() || undefined })}
                disabled={!newName.trim() || createList.isPending}
                loading={createList.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#D4A85C" /></View>
      ) : (
        <FlashList
          data={lists || []}
          estimatedItemSize={80}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(tabs)/profile/lists/${item.id}` as any)}
              onLongPress={() => !item.isSystem && handleDelete(item)}
              style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#F5F0EB', fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
                  {item.description && <Text style={{ color: '#98989E', fontSize: 13, marginTop: 2 }}>{item.description}</Text>}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <Text style={{ color: '#D4A85C', fontSize: 11 }}>{item._count?.movies ?? 0} items</Text>
                    {item.isSystem && (
                      <Text style={{ color: '#98989E', fontSize: 11, textTransform: 'capitalize' }}>{item.systemType}</Text>
                    )}
                  </View>
                </View>
                {!item.isSystem && (
                  <Text style={{ color: '#98989E', fontSize: 18 }}>{'›'}</Text>
                )}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: '#98989E', fontSize: 15 }}>No lists yet. Tap + to create one.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
