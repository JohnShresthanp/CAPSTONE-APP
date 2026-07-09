import { RootProvider } from '@/providers/RootProvider';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <RootProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="movie/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="person/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="media/[provider]/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="review/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="admin"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="modal/review-form"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </RootProvider>
  );
}
