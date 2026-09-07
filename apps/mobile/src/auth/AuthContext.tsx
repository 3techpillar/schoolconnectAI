import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ApiError,
  hasFullAppAccess,
  type Role,
  type UserProfile,
  SIGNUP_ROLES,
} from '@schoolconnect/shared';
import {apiFetch, appConfig, isBackendReady} from '../api';
import {getToken, loadSession, saveSession, setToken} from './tokenStorage';

type AuthCtx = {
  user: UserProfile | null;
  ready: boolean;
  backend: boolean;
  sendOtp: (identifier: string) => Promise<void>;
  verifyOtp: (
    identifier: string,
    otp: string,
  ) => Promise<{existing: boolean; user?: UserProfile}>;
  completeRegistration: (data: {
    identifier: string;
    name: string;
    role: Role;
    school: string;
    className?: string;
    childName?: string;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<UserProfile>;
  needsSchool: boolean;
  needsApproval: boolean;
  hasAccess: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [backend, setBackend] = useState(false);

  const refreshUser = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const res = await apiFetch<{user: UserProfile}>('/api/me');
      setUser(res.user);
      await saveSession(token, res.user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await setToken(null);
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await loadSession();
      if (cancelled) return;
      if (cached.user) {
        setUser(cached.user);
        setReady(true);
      }

      const up = await isBackendReady();
      if (cancelled) return;
      setBackend(up);

      if (cached.token) {
        await refreshUser();
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const sendOtp = useCallback(async (identifier: string) => {
    await apiFetch('/api/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({identifier}),
    });
  }, []);

  const verifyOtp = useCallback(
    async (identifier: string, otp: string) => {
      const res = await apiFetch<{
        existing: boolean;
        user?: UserProfile;
        token?: string;
      }>('/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({identifier, otp}),
      });
      if (res.token) {
        await saveSession(res.token, res.user || null);
      }
      if (res.user) setUser(res.user);
      return {existing: res.existing, user: res.user};
    },
    [],
  );

  const completeRegistration = useCallback(
    async (data: {
      identifier: string;
      name: string;
      role: Role;
      school: string;
      className?: string;
      childName?: string;
    }) => {
      const res = await apiFetch<{user: UserProfile; token?: string}>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      );
      if (res.token) {
        await saveSession(res.token, res.user);
      }
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', {method: 'POST', body: '{}'});
    } catch {
      /* ignore */
    }
    await setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    const res = await apiFetch<{user: UserProfile}>('/api/me', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    const token = await getToken();
    if (token) await saveSession(token, res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const needsSchool = Boolean(user && !user.schoolId && user.role !== 'super_admin');
  const hasAccess = hasFullAppAccess(user, true);
  const needsApproval = Boolean(user && !hasAccess && !needsSchool);

  const value = useMemo(
    () => ({
      user,
      ready,
      backend,
      sendOtp,
      verifyOtp,
      completeRegistration,
      logout,
      refreshUser,
      updateProfile,
      needsSchool,
      needsApproval,
      hasAccess,
    }),
    [
      user,
      ready,
      backend,
      sendOtp,
      verifyOtp,
      completeRegistration,
      logout,
      refreshUser,
      updateProfile,
      needsSchool,
      needsApproval,
      hasAccess,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth requires AuthProvider');
  return ctx;
}

export {SIGNUP_ROLES, appConfig};
