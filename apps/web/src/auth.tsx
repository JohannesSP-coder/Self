import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, getToken, setToken, setUnauthorizedHandler, type User } from "./api";
import { compressAvatar } from "./images";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Object or data URL of the profile picture; null while there is none (or it is still loading). */
  avatarUrl: string | null;
  /** True right after registering in this session, so the first redirect goes to onboarding. */
  isNewUser: boolean;
  finishOnboarding: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => getToken() !== null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsNewUser(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  // Reload the picture whenever it changes; the version is a timestamp, so it is also the cache key.
  const avatarVersion = user ? user.avatarVersion : null;
  useEffect(() => {
    if (!avatarVersion) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    let loaded: string | null = null;
    api
      .avatarImage()
      .then((url) => {
        loaded = url;
        if (cancelled) {
          if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        } else {
          setAvatarUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) setAvatarUrl(null);
      });
    return () => {
      cancelled = true;
      if (loaded?.startsWith("blob:")) URL.revokeObjectURL(loaded);
    };
  }, [avatarVersion]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setIsNewUser(false);
    setUser(res.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.register(name, email, password);
    setToken(res.token);
    setIsNewUser(true);
    setUser(res.user);
  }, []);

  const updateAvatar = useCallback(async (file: File) => {
    const image = await compressAvatar(file);
    const res = await api.setAvatar(image);
    setUser(res.user);
  }, []);

  const removeAvatar = useCallback(async () => {
    const res = await api.removeAvatar();
    setUser(res.user);
  }, []);

  const finishOnboarding = useCallback(() => setIsNewUser(false), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      avatarUrl,
      isNewUser,
      finishOnboarding,
      login,
      register,
      logout,
      updateAvatar,
      removeAvatar,
    }),
    [user, loading, avatarUrl, isNewUser, finishOnboarding, login, register, logout, updateAvatar, removeAvatar],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
