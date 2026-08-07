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

const ROLE_CACHE_KEY = 'kb_role';

/**
 * The admin panel renders nothing until the role is known, so waiting on a
 * profiles round-trip leaves a blank screen on every navigation. Caching the
 * last known role keyed by user id lets a returning admin render immediately
 * while the real role is revalidated in the background.
 *
 * This is a rendering optimisation, not an authorisation check — every admin
 * API route independently enforces requireAdmin() server-side, so a stale or
 * tampered cache grants no actual access.
 */
function readCachedRole(userId: string): 'admin' | 'customer' | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(ROLE_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed?.id !== userId) return null;
        return parsed.role === 'admin' ? 'admin' : 'customer';
    } catch {
        return null;
    }
}

function writeCachedRole(userId: string, role: 'admin' | 'customer') {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ id: userId, role }));
    } catch { /* storage unavailable — fall back to fetching each time */ }
}

export function AuthProvider({ children }: AuthProviderProps) {
    const {
        setUser,
        setIsAuthenticated,
        setIsLoading,
        syncAllData,
        clearSession,
        isLoading,
        isAuthenticated
    } = useStore();

    const authSetByEvent = useRef(false);

    useEffect(() => {
        const supabase = getSupabaseClient();
        let isMounted = true;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event: AuthChangeEvent, session: Session | null) => {
                if (!isMounted) return;

                // Supabase holds an internal lock while dispatching this event —
                // any Supabase call made synchronously inside this callback (like
                // the profiles lookup below) can deadlock against it. Deferring to
                // the next tick is Supabase's own documented workaround, and it's
                // what caused the admin login page to hang after the role lookup
                // was added directly in this callback.
                setTimeout(async () => {
                    if (!isMounted) return;

                    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
                        authSetByEvent.current = true;
                        // Skip anonymous users from setting full user state (they stay as guests)
                        const isAnon = session.user.is_anonymous;
                        if (!isAnon) {
                            const baseUser = {
                                id: session.user.id,
                                email: session.user.email || '',
                                full_name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                            };

                            // Render immediately from the cached role, so returning
                            // admins don't stare at a blank guard while we fetch.
                            const cached = readCachedRole(session.user.id);
                            if (cached) {
                                setUser({ ...baseUser, role: cached });
                                setIsAuthenticated(true);
                                setIsLoading(false);
                            }

                            // Look up the real role — a hardcoded 'customer' here silently
                            // logs admins out of any freshly-loaded tab (new tab, print,
                            // window.open), since AdminLayout's guard checks role === 'admin'.
                            let role: 'admin' | 'customer' = 'customer';
                            try {
                                const { data: profile } = await supabase
                                    .from('profiles')
                                    .select('role')
                                    .eq('id', session.user.id)
                                    .single();
                                if (profile?.role === 'admin') role = 'admin';
                            } catch {
                                // Network/RLS failure — keep whatever the cache said
                                // rather than demoting a signed-in admin mid-session.
                                if (cached) { setIsLoading(false); return; }
                            }

                            if (!isMounted) return;
                            writeCachedRole(session.user.id, role);
                            setUser({ ...baseUser, role });
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
                        // clearSession, not logout(): the session is already
                        // gone by the time this fires, and logout() would call
                        // signOut() again and re-enter this same branch.
                        clearSession();
                        setIsLoading(false);
                    }
                }, 0);
            }
        );

        // Fallback after 500ms
        const fallbackTimeout = setTimeout(async () => {
            if (!isMounted || authSetByEvent.current) return;

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!isMounted) return;

                if (session?.user && !session.user.is_anonymous) {
                    const baseUser = {
                        id: session.user.id,
                        email: session.user.email || '',
                        full_name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                    };

                    const cached = readCachedRole(session.user.id);
                    if (cached) {
                        setUser({ ...baseUser, role: cached });
                        setIsAuthenticated(true);
                        setIsLoading(false);
                    }

                    let role: 'admin' | 'customer' = 'customer';
                    try {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', session.user.id)
                            .single();
                        if (profile?.role === 'admin') role = 'admin';
                    } catch {
                        if (cached) return;
                    }

                    writeCachedRole(session.user.id, role);
                    setUser({ ...baseUser, role });
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
