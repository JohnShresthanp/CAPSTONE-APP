import { useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { apiClient } from '@/services/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useReviewDetail, useReviewComments, useToggleLike, useAddComment } from '@/features/reviews';
import { Button } from '@/shared/ui';

export default function ReviewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: review, isLoading } = useReviewDetail(id ?? '');
  const { data: comments, isLoading: commentsLoading } = useReviewComments(id ?? '');
  const toggleLike = useToggleLike();
  const addComment = useAddComment();

  const [commentText, setCommentText] = useState('');

  const handleLike = () => {
    if (!user) { Alert.alert('Sign in', 'Sign in to like reviews'); return; }
    toggleLike.mutate(id ?? '');
  };

  const handleComment = () => {
    if (!commentText.trim() || !user) return;
    addComment.mutate({ reviewId: id ?? '', body: commentText.trim() }, {
      onSuccess: () => setCommentText(''),
    });
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top, justifyContent: 'center' }}>
        <ActivityIndicator color="#D4A85C" />
      </View>
    );
  }

  if (!review) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#98989E', fontSize: 15 }}>Review not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top }}>
      {review.movie && (
        <Pressable
          onPress={() => router.push(`/movie/${review.movie.id}`)}
          style={{ flexDirection: 'row', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' }}
        >
          {review.movie.posterUrl && (
            <Image source={{ uri: review.movie.posterUrl }} style={{ width: 40, height: 60, borderRadius: 6 }} contentFit="cover" />
          )}
          <View style={{ justifyContent: 'center' }}>
            <Text style={{ color: '#F5F0EB', fontSize: 15, fontWeight: '600' }}>{review.movie.title}</Text>
            <Text style={{ color: '#D4A85C', fontSize: 12, marginTop: 2 }}>{'★'.repeat(Math.round(review.rating))}</Text>
          </View>
        </Pressable>
      )}

      <View style={{ padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#98989E', fontSize: 14, fontWeight: '600' }}>
              {review.user?.username?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View>
            <Text style={{ color: '#F5F0EB', fontSize: 14, fontWeight: '600' }}>{review.user?.username ?? 'Anonymous'}</Text>
            <Text style={{ color: '#98989E', fontSize: 11 }}>{new Date(review.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <Text style={{ color: '#D4A85C', fontSize: 16, marginVertical: 4 }}>
          {'★'.repeat(Math.round(review.rating))}{'☆'.repeat(5 - Math.round(review.rating))}
        </Text>

        {review.body && (
          <Text style={{ color: '#F5F0EB', fontSize: 14, lineHeight: 20, opacity: 0.8 }}>{review.body}</Text>
        )}

        {review._count && (
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
            <Pressable onPress={handleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: user ? '#FF453A' : '#98989E', fontSize: 16 }}>{'♥'}</Text>
              <Text style={{ color: '#98989E', fontSize: 12 }}>{review._count.likes}</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#98989E', fontSize: 14 }}>{'💬'}</Text>
              <Text style={{ color: '#98989E', fontSize: 12 }}>{review._count.comments}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: '#2C2C2E', padding: 16, gap: 12 }}>
        <Text style={{ color: '#F5F0EB', fontSize: 15, fontWeight: '600' }}>Comments</Text>

        {user && (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              placeholderTextColor="#98989E"
              style={{ flex: 1, color: '#F5F0EB', fontSize: 13, backgroundColor: '#2C2C2E', borderRadius: 8, padding: 10, minHeight: 36 }}
              accessibilityLabel="Write a comment"
            />
            <Pressable
              onPress={handleComment}
              disabled={!commentText.trim() || addComment.isPending}
              style={{ opacity: commentText.trim() ? 1 : 0.5 }}
            >
              <Text style={{ color: '#D4A85C', fontSize: 13, fontWeight: '600' }}>Post</Text>
            </Pressable>
          </View>
        )}

        {commentsLoading ? (
          <ActivityIndicator color="#D4A85C" />
        ) : (comments as any[])?.length > 0 ? (
          (comments as any[]).map((c: any) => (
            <View key={c.id} style={{ backgroundColor: '#2C2C2E', borderRadius: 10, padding: 12, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#F5F0EB', fontSize: 12, fontWeight: '600' }}>{c.user?.username ?? 'Anonymous'}</Text>
                <Text style={{ color: '#98989E', fontSize: 10 }}>{new Date(c.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={{ color: '#F5F0EB', fontSize: 13, opacity: 0.8 }}>{c.body}</Text>
              {c.replies?.map((r: any) => (
                <View key={r.id} style={{ paddingLeft: 16, marginTop: 6, borderLeftWidth: 2, borderLeftColor: '#3A3A3C' }}>
                  <Text style={{ color: '#98989E', fontSize: 11, fontWeight: '600' }}>{r.user?.username}</Text>
                  <Text style={{ color: '#F5F0EB', fontSize: 12, opacity: 0.7 }}>{r.body}</Text>
                </View>
              ))}
            </View>
          ))
        ) : (
          <Text style={{ color: '#98989E', fontSize: 13 }}>No comments yet</Text>
        )}
      </View>
    </ScrollView>
  );
}
