"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (email !== "aditya.vishnu@duk.ac.in") {
            router.push("/");
        }

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;

            toast({ title: "Login Successful!" });
            router.push("/controls/dashboard");
        } catch (error) {
            console.error("Error during login:", error);
            toast({
                title: "Login Failed",
                description: "There was an error logging in. " + error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="h-screen mx-auto max-w-2xl flex items-center">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Admin Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-4">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-4">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="************"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full"
                        disabled={isLoading}
                        onClick={handleLogin}
                    >
                        {isLoading ? "Logging in..." : "Login"}
                    </Button>
                </CardFooter>
            </Card>
        </main>
    );
}
