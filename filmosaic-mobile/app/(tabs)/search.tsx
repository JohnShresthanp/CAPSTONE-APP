import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSearch } from '@/features/search/api/useSearch';
import type { MediaResult } from '@/features/search/api/useSearch';
import { useDebounce } from '@/shared/hooks/useDebounce';

const FILTERS = ['All', 'Movies', 'Books', 'Music', 'People'] as const;
type Filter = (typeof FILTERS)[number];

function ResultCard({ item }: { item: MediaResult }) {
  const route = item.type === 'movie'
    ? `/movie/${item.externalId}` as any
    : item.type === 'person'
    ? `/person/${item.externalId}` as any
    : `/media/${item.provider}/${item.externalId}` as any;

  return (
    <Pressable
      onPress={() => router.push(route)}
      style={{ flexDirection: 'row', padding: 12, gap: 12 }}
      accessibilityLabel={`${item.title}, ${item.type}`}
    >
      <View style={{ width: 60, height: 90, backgroundColor: '#3A3A3C', borderRadius: 8, overflow: 'hidden' }}>
        {item.poster ? (
          <Image source={{ uri: item.poster }} style={{ width: 60, height: 90 }} contentFit="cover" cachePolicy="disk" />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#98989E', fontSize: 10 }}>{item.type[0]?.toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={{ color: '#F5F0EB', fontSize: 15, fontWeight: '600' }} numberOfLines={2}>{item.title}</Text>
        {item.subtitle ? <Text style={{ color: '#98989E', fontSize: 13, marginTop: 2 }}>{item.subtitle}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          <View style={{ backgroundColor: '#D4A85C20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
            <Text style={{ color: '#D4A85C', fontSize: 10, textTransform: 'capitalize' }}>{item.type}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useSearch(debouncedQuery);

  const filtered = (data ?? []).filter((r) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Movies') return r.type === 'movie';
    if (activeFilter === 'Books') return r.type === 'book';
    if (activeFilter === 'Music') return r.type === 'album' || r.type === 'artist';
    if (activeFilter === 'People') return r.type === 'person';
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#1C1C1E', paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
        <View style={{ backgroundColor: '#3A3A3C', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
          <TextInput
            placeholder="Search movies, books, music..."
            placeholderTextColor="#98989E"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            style={{ color: '#F5F0EB', fontSize: 15, outlineStyle: 'none' }}
            accessibilityLabel="Search"
          />
        </View>
        <FlashList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          estimatedItemSize={60}
          keyExtractor={(f) => f}
          renderItem={({ item: filter }) => (
            <Pressable
              onPress={() => setActiveFilter(filter)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: activeFilter === filter ? '#D4A85C' : '#3A3A3C',
                marginRight: 8,
              }}
            >
              <Text style={{ color: activeFilter === filter ? '#1C1C1E' : '#F5F0EB', fontSize: 13, fontWeight: '500' }}>
                {filter}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#D4A85C" />
        </View>
      ) : (
        <FlashList
          data={filtered}
          renderItem={({ item }) => <ResultCard item={item} />}
          keyExtractor={(item) => item.id}
          estimatedItemSize={120}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            debouncedQuery.trim() ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: '#98989E', fontSize: 15 }}>No results found</Text>
              </View>
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: '#98989E', fontSize: 15 }}>Start typing to search</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}
