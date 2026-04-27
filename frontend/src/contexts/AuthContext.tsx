import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/quiz';
import { loginApi, registerApi, logoutApi, fetchMe } from '@/api/auth';
import { getRefreshToken, setAccessToken, setRefreshToken } from '@/api/client';
import { disconnectAll } from '@/socket/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const rt = getRefreshToken();
    if (!rt) {
      setIsLoading(false);
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => {
        setAccessToken(null);
        setRefreshToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await loginApi(email, password);
    setUser(u);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const u = await registerApi(email, password, displayName);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    const rt = getRefreshToken();
    if (rt) logoutApi(rt);
    setAccessToken(null);
    setRefreshToken(null);
    disconnectAll();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
