import { useState, useEffect, useRef, createContext, useContext, createElement } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { User, UserProfile } from '../lib/supabase';
import type { ReactNode } from 'react';

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const initializedRef = useRef(false);

  // Controla flag de montagem sem re-render (evita StrictMode glitches)
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Função para buscar perfil de usuário
  // Utilitário de timeout para promessas
  const withTimeout = async <T,>(promise: Promise<T>, ms = 1500): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const id = setTimeout(() => reject(new Error('Timeout')), ms);
      promise
        .then((res) => {
          clearTimeout(id);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(id);
          reject(err);
        });
    });
  };

  // Cache local de perfil
  const cacheKey = (userId: string) => `profile:${userId}`;
  const getCachedProfile = (userId: string): UserProfile | null => {
    try {
      if (typeof window === 'undefined') return null;
      const raw = window.localStorage.getItem(cacheKey(userId));
      if (!raw) return null;
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  };
  const setCachedProfile = (userId: string, profile: UserProfile) => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(cacheKey(userId), JSON.stringify(profile));
    } catch {
      // ignore quota/serialize errors
    }
  };

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    console.log('useAuth: fetchUserProfile called with', userId);
    const cached = getCachedProfile(userId);
    if (cached) {
      // Atualiza em background sem bloquear
      void (async () => {
        try {
          console.time('useAuth: fetchUserProfile.network');
          const { data } = await withTimeout(
            supabase
              .from('users_profiles')
              .select('id,user_id,name,avatar_url')
              .eq('user_id', userId)
              .single(),
            1200
          );
          console.timeEnd('useAuth: fetchUserProfile.network');
          if (data) {
            setCachedProfile(userId, data as UserProfile);
            if (isMountedRef.current) setProfile(data as UserProfile);
          }
        } catch (e) {
          console.warn('Atualização de perfil em background falhou:', e);
        }
      })();
      return cached;
    }
    try {
      console.time('useAuth: fetchUserProfile.network');
      const { data } = await withTimeout(
        supabase
          .from('users_profiles')
          .select('id,user_id,name,avatar_url')
          .eq('user_id', userId)
          .single(),
        1200
      );
      console.timeEnd('useAuth: fetchUserProfile.network');
      if (data) setCachedProfile(userId, data as UserProfile);
      return data || null;
    } catch (e) {
      console.warn('Erro ao buscar perfil do usuário:', e);
      const fallbackProfile: UserProfile = {
        id: userId,
        user_id: userId,
        name: 'Usuário',
        avatar_url: undefined,
        role: 'Membro',
      };
      return fallbackProfile;
    }
  };

  // Centraliza fluxo de autenticação
  const setAuthState = async (session: Session | null) => {
    console.log('useAuth: setAuthState start, session =', session);
    if (!isMountedRef.current) return;
    if (!initializedRef.current) setLoading(true);

    try {
      if (session?.user) {
        setUser(session.user as User);
        // Buscar perfil em background para não segurar o loading
        void fetchUserProfile(session.user.id).then((profileData) => {
          if (isMountedRef.current) setProfile(profileData);
        });
      } else {
        if (isMountedRef.current) {
          setUser(null);
          setProfile(null);
        }
      }
    } finally {
      if (isMountedRef.current && !initializedRef.current) {
        setLoading(false);
        initializedRef.current = true;
      }
      console.log('useAuth: setAuthState end, loading =', loading);
    }
  };

  // Efeito principal de inicialização e subscrição
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('useAuth: initializeAuth start');
      try {
        console.time('useAuth: getSession');
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 1500);
        console.timeEnd('useAuth: getSession');
        console.log('useAuth: initializeAuth got session =', session);
        await setAuthState(session);
      } catch (e) {
        console.error('Erro ao iniciar sessão:', e);
        await setAuthState(null);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('useAuth: onAuthStateChange event, session =', session);
        await setAuthState(session);
      }
    );

    return () => {
      console.log('useAuth: unsubscribing auth listener');
      subscription.unsubscribe();
    };
  }, []);

  // Métodos de login/logout
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return createElement(
    AuthContext.Provider,
    { value: { user, profile, loading, signIn, signOut } },
    children
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}