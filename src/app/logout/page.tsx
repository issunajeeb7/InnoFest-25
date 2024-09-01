"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function Logout() {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        const handleLogout = async () => {
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;

                toast({
                    title: "Logged Out",
                    description: "You have been successfully logged out.",
                });
                router.push("/");
            } catch (error) {
                console.error("Error during logout:", error);
                toast({
                    title: "Logout Failed",
                    description:
                        "There was an error logging out. Please try again.",
                    variant: "destructive",
                });
            }
        };

        handleLogout();
    }, [router, supabase, toast]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-2xl font-bold mb-4">Logging Out</h1>
            <p className="mb-4">Please wait while we log you out...</p>
            <Button onClick={() => router.push("/login")}>
                Return to Login
            </Button>
        </div>
    );
}
