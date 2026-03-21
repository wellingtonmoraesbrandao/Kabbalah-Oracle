import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    signOut: async () => { },
});

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Handle tokens from URL query parameters (after Stripe checkout redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const welcome = urlParams.get('welcome');

        const initializeAuth = async () => {
            try {
                // If we have tokens in URL (from Stripe callback), set the session
                if (accessToken && refreshToken) {
                    console.log('Setting session from Stripe callback tokens...');
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (!error) {
                        console.log('Session set successfully from Stripe callback');

                        // Clear URL parameters after successful login
                        window.history.replaceState({}, '', window.location.pathname);

                        // Show welcome message for new users
                        if (welcome === 'true') {
                            console.log('Welcome new user!');
                            // You could dispatch a custom event or use state to show a welcome modal
                        }
                    } else {
                        console.error('Error setting session:', error);
                    }
                }

                // Get current session
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                setSession(currentSession);
                setUser(currentSession?.user ?? null);
            } catch (err) {
                console.error('Error initializing auth:', err);
            } finally {
                setLoading(false);
            }
        };

        // Initialize auth - either from URL tokens or from existing session
        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        session,
        user,
        loading,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
