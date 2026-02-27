'use client';

import { LoaderCircle } from 'lucide-react';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';

import { auth, googleProvider } from '@/lib/firebase/client';
import type { UserProfile } from '@/lib/types';

type AppRoute = '/catalog' | '/dashboard' | '/history' | '/admin' | '/admin/books' | '/login';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncSessionAndProfile(currentUser: User): Promise<UserProfile | null> {
  const idToken = await currentUser.getIdToken(true);

  const sessionResponse = await fetch('/api/auth/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  if (!sessionResponse.ok) {
    return null;
  }

  const syncResponse = await fetch('/api/auth/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  if (!syncResponse.ok) {
    return null;
  }

  const payload = (await syncResponse.json()) as { profile?: UserProfile };
  return payload.profile ?? null;
}

function normalizeRedirectPath(input: string | null): AppRoute {
  const allowedRoutes: AppRoute[] = [
    '/catalog',
    '/dashboard',
    '/history',
    '/admin',
    '/admin/books',
    '/login',
  ];
  if (!input) {
    return '/catalog';
  }

  const normalized = input.split('?')[0] as AppRoute;
  return allowedRoutes.includes(normalized) ? normalized : '/catalog';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return;
    }

    const syncedProfile = await syncSessionAndProfile(auth.currentUser);
    setProfile(syncedProfile);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const syncedProfile = await syncSessionAndProfile(nextUser);
        setProfile(syncedProfile);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const syncedProfile = await syncSessionAndProfile(credential.user);
      setUser(credential.user);
      setProfile(syncedProfile);

      const redirectParam =
        typeof window === 'undefined'
          ? null
          : new URLSearchParams(window.location.search).get('redirect');
      const destination = normalizeRedirectPath(redirectParam);
      router.replace((destination === '/login' ? '/catalog' : destination) as Route);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const signOutUser = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!auth.currentUser) {
      return null;
    }

    return auth.currentUser.getIdToken();
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signInWithGoogle,
      signOutUser,
      getIdToken,
      refreshProfile,
    }),
    [getIdToken, loading, profile, refreshProfile, signInWithGoogle, signOutUser, user],
  );

  if (loading && pathname !== '/login') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-bg)]">
        <LoaderCircle className="h-6 w-6 animate-spin text-[var(--brand-primary)]" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
