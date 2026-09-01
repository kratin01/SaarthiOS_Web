/**
 * Holds the signed-in user for the whole app.
 * On first load it exchanges the stored token for the user, which is also how
 * an expired session gets cleaned up.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/api';
import { tokenStore } from '@/api/http';
import type { User } from '@/types';

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: signedIn } = await authApi.login({ email, password });
    tokenStore.set(token);
    setUser(signedIn);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { token, user: created } = await authApi.register({ name, email, password });
    tokenStore.set(token);
    setUser(created);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const { token, user: signedIn } = await authApi.google(credential);
    tokenStore.set(token);
    setUser(signedIn);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, loginWithGoogle, logout, setUser }),
    [user, loading, login, register, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
