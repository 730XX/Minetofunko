import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type AuthStatus = 'idle' | 'signing_in' | 'signing_out';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authStatus: AuthStatus;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');

  useEffect(() => {
    // 1. Obtener la sesión activa al inicializar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Escuchar cambios de autenticación en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setAuthStatus('idle');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Inicializar Google One Tap si el usuario no está logueado
  useEffect(() => {
    if (loading || user) return;

    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '445225640881-dlj287bh8sto3l2jgd8hkski0t3bp3ib.apps.googleusercontent.com';

    let timer: ReturnType<typeof setTimeout> | null = null;

    const initOneTap = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) {
        // El script de Google aún se está descargando; reintentar en 500ms
        timer = setTimeout(initOneTap, 500);
        return;
      }

      try {
        google.accounts.id.initialize({
          client_id: clientId,
          use_fedcm_for_prompt: true,
          callback: async (response: { credential: string }) => {
            try {
              setAuthStatus('signing_in');
              const { error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
              });
              if (error) {
                setAuthStatus('idle');
                throw error;
              }
            } catch (authErr) {
              setAuthStatus('idle');
              console.error('Error al autenticar con Google One Tap:', authErr);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        google.accounts.id.prompt();
      } catch (err) {
        console.warn('Error inicializando Google One Tap:', err);
      }
    };

    initOneTap();

    return () => {
      if (timer) clearTimeout(timer);
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.cancel();
      }
    };
  }, [loading, user]);

  const signInWithGoogle = async () => {
    try {
      setAuthStatus('signing_in');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        setAuthStatus('idle');
        throw error;
      }
    } catch (err) {
      setAuthStatus('idle');
      console.error('Error al iniciar sesión con Google:', err);
      alert('Hubo un error al conectar con Google. Revisa la consola para más detalles.');
    }
  };

  const signOut = async () => {
    try {
      setAuthStatus('signing_out');
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthStatus('idle');
        throw error;
      }
    } catch (err) {
      setAuthStatus('idle');
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, authStatus, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
