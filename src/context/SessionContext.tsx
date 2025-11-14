// context/SessionContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Session } from "@supabase/supabase-js";

type SessionContextType = {
    session: Session | null;
    loading: boolean;
};

const SessionContext = createContext<SessionContextType>({
    session: null,
    loading: true,
});

export const useSession = () => useContext(SessionContext);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            console.log("=== SessionContext fetchSession ===");
            console.log("Session from Supabase:", session);
            if (session?.user) {
                console.log("User ID from session:", session.user.id);
                console.log("User email from session:", session.user.email);
            }
            setSession(session);
            setLoading(false);
        };

        fetchSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("=== SessionContext onAuthStateChange ===");
            console.log("Event:", _event);
            console.log("Session:", session);
            if (session?.user) {
                console.log("User ID:", session.user.id);
                console.log("User email:", session.user.email);
            }
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    return (
        <SessionContext.Provider value={{ session, loading }}>
            {children}
        </SessionContext.Provider>
    );
};
