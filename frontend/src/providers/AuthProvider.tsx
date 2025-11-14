import { useState, useEffect, ReactNode } from 'react';
import { AuthContext, User } from '../contexts/AuthContext';
import {
  getAccessToken,
  removeAccessToken,
  removeRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../utils/token';
import { request, requestWithoutAuth } from '../utils/request';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const getUser = async () => {
    try {
      setLoading(true);
      const { data } = await request.get<{ status: string; data: { user: User } }>('/api/auth/user');
      setUser(data.data.user);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Failed to get user:', error);
      removeAccessToken();
      removeRefreshToken();
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const { data } = await requestWithoutAuth.post<{
      status: string;
      data: { user: User; accessToken: string; refreshToken: string };
    }>('/api/auth/login', { username, password });

    setAccessToken(data.data.accessToken);
    setRefreshToken(data.data.refreshToken);
    setUser(data.data.user);
    setIsLoggedIn(true);
  };

  const signup = async (username: string, password: string) => {
    const { data } = await requestWithoutAuth.post<{
      status: string;
      data: { user: User; accessToken: string; refreshToken: string };
    }>('/api/auth/signup', { username, password });

    setAccessToken(data.data.accessToken);
    setRefreshToken(data.data.refreshToken);
    setUser(data.data.user);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    removeAccessToken();
    removeRefreshToken();
  };

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      getUser();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}



