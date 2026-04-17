// AuthContext.tsx — Minimal auth context for single-user local app
//
// Auto-logs in on mount, provides user + token to all children.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateUsername: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  updateUsername: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authApi.autoLogin()
      .then(({ user, token }) => {
        setUser(user);
        setToken(token);
      })
      .catch(err => console.error('[Auth] Auto-login failed:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const updateUsername = async (name: string) => {
    if (!token) return;
    const { user: updated } = await authApi.updateUsername(name, token);
    if (updated) setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, updateUsername }}>
      {children}
    </AuthContext.Provider>
  );
};
