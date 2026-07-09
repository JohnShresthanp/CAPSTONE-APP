import { View, Text, TextInput, Pressable, Alert, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/api/client';
import { Button, Input } from '@/shared/ui';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!username.trim()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('username', username.trim());
      if (bio.trim()) formData.append('bio', bio.trim());
      const res = await apiClient.put('/api/users/me/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = res.data.data;
      updateUser({ username: updated.username });
      Alert.alert('Saved', 'Profile updated');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top, padding: 16, gap: 20 }}>
      <Text style={{ color: '#F5F0EB', fontSize: 20, fontWeight: '700' }}>Edit Profile</Text>

      {user?.avatar && (
        <Image source={{ uri: user.avatar }} style={{ width: 80, height: 80, borderRadius: 40, alignSelf: 'center' }} />
      )}

      <Input
        label="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        accessibilityLabel="Username"
      />

      <Input
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={3}
        accessibilityLabel="Bio"
      />

      <Button
        title="Save"
        onPress={handleSave}
        disabled={saving || !username.trim()}
        loading={saving}
        fullWidth
      />
    </View>
  );
}
