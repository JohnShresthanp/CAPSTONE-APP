import { View, Text, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useCreateReview } from '@/features/reviews';
import { Button } from '@/shared/ui';

export default function ReviewFormModal() {
  const insets = useSafeAreaInsets();
  const { movieId } = useLocalSearchParams<{ movieId: string }>();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const createReview = useCreateReview();

  const handleSubmit = () => {
    if (!body.trim() || !movieId) return;
    createReview.mutate(
      { movieId, rating, body: body.trim() },
      {
        onSuccess: () => {
          Alert.alert('Done', 'Review submitted');
          router.back();
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.response?.data?.message || 'Failed to submit review');
        },
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top, padding: 16, gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#F5F0EB', fontSize: 18, fontWeight: '700' }}>Write a Review</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: '#D4A85C', fontSize: 15 }}>Cancel</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} style={{ padding: 4 }}>
            <Text style={{ fontSize: 28, color: n <= rating ? '#D4A85C' : '#3A3A3C' }}>{'★'}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="What did you think?"
        placeholderTextColor="#98989E"
        multiline
        style={{
          color: '#F5F0EB', fontSize: 14, backgroundColor: '#2C2C2E',
          borderRadius: 12, padding: 16, minHeight: 150, textAlignVertical: 'top',
        }}
        accessibilityLabel="Review body"
      />

      <Button
        title="Submit"
        onPress={handleSubmit}
        disabled={!body.trim() || createReview.isPending}
        loading={createReview.isPending}
        fullWidth
      />
    </View>
  );
}
