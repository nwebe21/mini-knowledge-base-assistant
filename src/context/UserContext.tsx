"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
    useMemo,
} from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Session } from "@supabase/supabase-js";

interface User {
    id: string;
    fullname: string;
    email?: string | null;
}

interface UserContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const supabase = getSupabaseBrowserClient();
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const hydrateUser = useCallback((session: Session | null) => {
        setSession(session);
        if (!session) {
            setUser(null);
            return;
        }

        const metadata = session.user.user_metadata || {};
        const fullname =
            metadata.full_name ||
            metadata.username ||
            session.user.email ||
            "User";

        setUser({ id: session.user.id, fullname, email: session.user.email });
    }, []);

    const refreshUser = useCallback(async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        hydrateUser(session);
        setLoading(false);
    }, [hydrateUser, supabase]);

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            const {
            data: { session },
            } = await supabase.auth.getSession();
            if (isMounted) {
            hydrateUser(session);
            setLoading(false);
            }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (isMounted) {
            hydrateUser(session);
            setLoading(false);
        }
    });

    return () => {
        isMounted = false;
        authListener?.subscription.unsubscribe();
    };
    }, [hydrateUser, supabase]);

    const value = useMemo(
        () => ({
            user,
            session,
            loading,
            refreshUser,
    }),[user, session, loading, refreshUser]);

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
};