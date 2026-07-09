import { useEffect, useState } from 'react';
import { fetchCurrentUser, logoutUser } from '../services/authApi';

const STORAGE_KEY = 'filmMosaicUser';

export function useAuth() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('filmMosaicToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetchCurrentUser();
        setUser(response.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.user));
      } catch (error) {
        localStorage.removeItem('filmMosaicToken');
        localStorage.removeItem('filmMosaicRefreshToken');
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    if (!user) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [user]);

  const login = (data) => {
    localStorage.setItem('filmMosaicToken', data.token);
    localStorage.setItem('filmMosaicRefreshToken', data.refreshToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      // ignore network issues during logout
    }
    localStorage.removeItem('filmMosaicToken');
    localStorage.removeItem('filmMosaicRefreshToken');
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout
  };
}
