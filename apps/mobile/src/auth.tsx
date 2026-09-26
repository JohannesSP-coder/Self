import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, getToken, setToken, setUnauthorizedHandler, type User } from "./api";
import { pickAvatarFromLibrary, pickAvatarFromCamera } from "./images";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  avatarUri: string | null;
  /** True right after registering in this session, so the first redirect goes to onboarding. */
  isNewUser: boolean;
  finishOnboarding: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateAvatarFromLibrary: () => Promise<void>;
  updateAvatarFromCamera: () => Promise<void>;
  removeAvatar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

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
    (async () => {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.me();
        setUser(res.user);
      } catch {
        await setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const avatarVersion = user ? user.avatarVersion : null;
  useEffect(() => {
    if (!avatarVersion) {
      setAvatarUri(null);
      return;
    }
    let cancelled = false;
    api
      .avatarImage()
      .then((uri) => !cancelled && setAvatarUri(uri))
      .catch(() => !cancelled && setAvatarUri(null));
    return () => {
      cancelled = true;
    };
  }, [avatarVersion]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    await setToken(res.token);
    setIsNewUser(false);
    setUser(res.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.register(name, email, password);
    await setToken(res.token);
    setIsNewUser(true);
    setUser(res.user);
  }, []);

  const applyAvatar = useCallback(async (image: string | null) => {
    if (!image) return;
    const res = await api.setAvatar(image);
    setUser(res.user);
  }, []);

  const updateAvatarFromLibrary = useCallback(async () => {
    await applyAvatar(await pickAvatarFromLibrary());
  }, [applyAvatar]);

  const updateAvatarFromCamera = useCallback(async () => {
    await applyAvatar(await pickAvatarFromCamera());
  }, [applyAvatar]);

  const removeAvatar = useCallback(async () => {
    const res = await api.removeAvatar();
    setUser(res.user);
  }, []);

  const finishOnboarding = useCallback(() => setIsNewUser(false), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      avatarUri,
      isNewUser,
      finishOnboarding,
      login,
      register,
      logout,
      updateAvatarFromLibrary,
      updateAvatarFromCamera,
      removeAvatar,
    }),
    [user, loading, avatarUri, isNewUser, finishOnboarding, login, register, logout, updateAvatarFromLibrary, updateAvatarFromCamera, removeAvatar],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
