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

    // Use ref to track if auth state was set by onAuthStateChange
    const authSetByEvent = useRef(false);

    useEffect(() => {
        const supabase = getSupabaseClient();
        let isMounted = true;

        console.log('AuthProvider mounting...');

        // Listen for auth state changes first - this is the most reliable method
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                if (!isMounted) return;

                console.log('Auth state change:', event, session?.user?.email);

                if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
                    authSetByEvent.current = true;
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        full_name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                        role: 'customer'
                    });
                    setIsAuthenticated(true);
                    setIsLoading(false);

                    // Sync data in background
                    syncAllData().catch(e => console.warn('Sync error:', e));
                } else if (event === 'SIGNED_OUT') {
                    authSetByEvent.current = true;
                    logout();
                    setIsLoading(false);
                }
            }
        );

        // Fallback: after a delay, check if onAuthStateChange set the auth state
        // If not, try getSession as backup
        const fallbackTimeout = setTimeout(async () => {
            if (!isMounted) return;

            // If auth was already set by an event, skip the manual check
            if (authSetByEvent.current) {
                console.log('Auth already set by event, skipping fallback check');
                return;
            }

            console.log('Running fallback session check...');

            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (error) {
                    console.log('Fallback session check error:', error.message);
                    setIsLoading(false);
                    return;
                }

                if (session?.user) {
                    console.log('Fallback: found session for', session.user.email);
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        full_name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                        role: 'customer'
                    });
                    setIsAuthenticated(true);
                    syncAllData().catch(e => console.warn('Sync error:', e));
                } else {
                    console.log('Fallback: no session found');
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.warn('Fallback session check threw:', error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }, 500); // Wait 500ms for onAuthStateChange to fire first

        return () => {
            isMounted = false;
            clearTimeout(fallbackTimeout);
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps - only run once on mount

    return (
        <AuthContext.Provider value={{ isLoading, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}
