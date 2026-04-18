"use client";

import { createContext, useContext, useEffect, ReactNode, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useStore } from '@/lib/store';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextType {
    isLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    isLoading: true,
    isAuthenticated: false
});

export function useAuth() {
    return useContext(AuthContext);
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const {
        setUser,
        setIsAuthenticated,
        setIsLoading,
        syncAllData,
        logout,
        isLoading,
        isAuthenticated
    } = useStore();

    const authSetByEvent = useRef(false);

    useEffect(() => {
        const supabase = getSupabaseClient();
        let isMounted = true;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                if (!isMounted) return;

                if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
                    authSetByEvent.current = true;
                    // Skip anonymous users from setting full user state (they stay as guests)
                    const isAnon = session.user.is_anonymous;
                    if (!isAnon) {
                        setUser({
                            id: session.user.id,
                            email: session.user.email || '',
                            full_name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                            role: 'customer'
                        });
                        setIsAuthenticated(true);
                        syncAllData().catch(e => console.warn('Sync error:', e));
                    } else {
                        // Anonymous user — just mark loading done
                        setIsAuthenticated(false);
                        setIsLoading(false);
                        syncAllData().catch(() => {});
                    }
                    setIsLoading(false);
                } else if (event === 'SIGNED_OUT') {
                    authSetByEvent.current = true;
                    logout();
                    setIsLoading(false);
                }
            }
        );

        // Fallback after 500ms
        const fallbackTimeout = setTimeout(async () => {
            if (!isMounted || authSetByEvent.current) return;

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!isMounted) return;

                if (session?.user && !session.user.is_anonymous) {
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        full_name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                        role: 'customer'
                    });
                    setIsAuthenticated(true);
                    syncAllData().catch(e => console.warn('Sync error:', e));
                } else if (!session) {
                    // No session at all — sign in anonymously so guest orders can be placed
                    try {
                        await supabase.auth.signInAnonymously();
                    } catch {
                        // Anonymous sign-in not enabled or failed — continue as guest
                    }
                    setIsAuthenticated(false);
                    syncAllData().catch(() => {});
                } else {
                    setIsAuthenticated(false);
                    syncAllData().catch(() => {});
                }
            } catch (error) {
                console.warn('Fallback session check threw:', error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }, 500);

        return () => {
            isMounted = false;
            clearTimeout(fallbackTimeout);
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AuthContext.Provider value={{ isLoading, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}
