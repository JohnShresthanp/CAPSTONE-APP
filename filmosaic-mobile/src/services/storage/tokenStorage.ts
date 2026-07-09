import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'filmMosaicToken';
const REFRESH_TOKEN_KEY = 'filmMosaicRefreshToken';
const USER_KEY = 'filmMosaicUser';

export const tokenStorage = {
  async getToken() {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async setToken(token: string) {
    return SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token: string) {
    return SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },
  async getUser<T = Record<string, unknown>>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async setUser(user: Record<string, unknown>) {
    return SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },
  async clear() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
