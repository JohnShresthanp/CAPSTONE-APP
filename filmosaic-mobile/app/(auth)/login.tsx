import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/api/client';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/api/auth/login', { email, password });
      await login(res.data);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#1C1C1E' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Text style={{ color: '#D4A85C', fontSize: 28, fontWeight: '700', textAlign: 'center', letterSpacing: 2, marginBottom: 8 }}>
          FILMMOSAIC
        </Text>
        <Text style={{ color: '#98989E', fontSize: 15, textAlign: 'center', marginBottom: 40 }}>
          Sign in to continue
        </Text>

        {error ? (
          <View style={{ backgroundColor: '#FF453A20', padding: 12, borderRadius: 12, marginBottom: 16 }}>
            <Text style={{ color: '#FF453A', fontSize: 13, textAlign: 'center' }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ backgroundColor: '#3A3A3C', borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, marginBottom: 12 }}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#98989E"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ color: '#F5F0EB', fontSize: 15, outlineStyle: 'none' }}
            accessibilityLabel="Email address"
          />
        </View>

        <View style={{ backgroundColor: '#3A3A3C', borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, marginBottom: 24 }}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#98989E"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ color: '#F5F0EB', fontSize: 15, outlineStyle: 'none' }}
            accessibilityLabel="Password"
          />
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: '#D4A85C',
            borderRadius: 28,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: loading ? 0.5 : 1,
          }}
          accessibilityLabel="Sign in"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#1C1C1E" />
          ) : (
            <Text style={{ color: '#1C1C1E', fontSize: 15, fontWeight: '600' }}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          style={{ marginTop: 20, alignItems: 'center' }}
          accessibilityLabel="Create account"
          accessibilityRole="button"
        >
          <Text style={{ color: '#98989E', fontSize: 13 }}>
            Don&apos;t have an account?{' '}
            <Text style={{ color: '#D4A85C', fontWeight: '600' }}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
