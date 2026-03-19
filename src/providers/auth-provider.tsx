"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/utils/supabase";

interface AuthContextValue {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => {},
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = getSupabase();

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    async function signOut() {
        await getSupabase().auth.signOut();
        setSession(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user: session?.user ?? null,
                session,
                loading,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
