"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

export default function Home() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Proceed with login
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            toast({
                title: "Login Successful",
                description: "Please continue with your team confirmation.",
            });
            router.push("/confirm");
        } catch (error: any) {
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
        <section className="bg-white">
            <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
                <section className="relative flex h-32 items-end bg-gray-900 lg:col-span-5 lg:h-full xl:col-span-6">
                    <Image
                        alt=""
                        width={1000}
                        height={800}
                        src="https://images.unsplash.com/photo-1555432782-efda97a5088a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        className="absolute inset-0 h-full w-full object-cover opacity-80"
                    />

                    <div className="hidden lg:relative lg:block lg:p-12">
                        <Link className="block text-white" href="/">
                            <span className="sr-only">Home</span>
                            <svg
                                className="h-8 sm:h-10"
                                viewBox="0 0 51 50"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M50.0954 3.0813C50.0921 2.93266 50.0865 2.78403 50.081 2.63483C50.0748 2.46838 50.0698 2.30249 50.0609 2.13548C50.0437 1.80035 50.022 1.46355 49.9936 1.12563C49.9485 0.583972 49.5181 0.154204 48.9765 0.108555C48.6386 0.0801639 48.3029 0.0590095 47.9683 0.0411953C47.7985 0.0322882 47.6304 0.027278 47.4623 0.0211544C47.3164 0.0161441 47.17 0.0100205 47.0247 0.00723702C46.7814 0.00167008 46.5398 0 46.2988 0C46.2587 0 46.2181 1.10173e-09 46.178 0.000556695C41.3748 0.0239378 36.9658 1.20302 32.5145 3.63354C32.436 3.67696 32.3575 3.7176 32.279 3.76047C32.2512 3.77605 32.2239 3.78941 32.1961 3.805C32.1899 3.80834 32.1849 3.81391 32.1788 3.81725C28.5291 5.85141 24.8856 8.72228 21.1145 12.4933C20.6859 12.922 20.2667 13.3562 19.8519 13.7926L12.5236 14.3499C12.3093 14.366 12.1044 14.444 11.9335 14.5737L0.439474 23.321C0.0737261 23.5994 -0.0838183 24.0737 0.0436646 24.5151C0.170591 24.9566 0.555823 25.2744 1.01342 25.3162L11.7983 26.2899L15.213 29.7046C14.0028 29.9813 12.7697 30.6593 11.7136 31.7148C11.0812 32.3478 10.5735 33.057 10.2017 33.8319C9.71566 34.8613 8.64848 37.5117 7.51839 40.318L6.96671 41.6869C6.7997 42.1011 6.89601 42.5748 7.21221 42.8905C7.42487 43.1037 7.70989 43.2167 7.99993 43.2167C8.13966 43.2167 8.28106 43.19 8.41634 43.1354L9.83424 42.5637C12.6177 41.4425 15.247 40.3831 16.2785 39.8971C17.0468 39.5275 17.7565 39.0198 18.3884 38.3879C19.4439 37.3324 20.1214 36.0994 20.3981 34.8891L23.7115 38.2025L24.6852 48.9868C24.7263 49.4444 25.0448 49.8297 25.4862 49.9566C25.5881 49.9861 25.6917 50 25.7941 50C26.1359 50 26.466 49.8425 26.6803 49.5608L35.4266 38.0673C35.5563 37.8964 35.6342 37.6915 35.6503 37.4772L36.1909 30.3654C36.668 29.9139 37.1406 29.4552 37.6088 28.9876C41.3826 25.2138 44.2552 21.5685 46.2899 17.9166C46.2921 17.9127 46.2954 17.9094 46.2977 17.9055C46.3077 17.8877 46.316 17.8704 46.3261 17.8526C46.419 17.685 46.5075 17.5175 46.5966 17.3494C48.9386 12.981 50.0765 8.64545 50.101 3.9336C50.1016 3.88739 50.1016 3.84174 50.1016 3.79554C50.1027 3.55894 50.101 3.32068 50.0954 3.0813ZM35.8608 20.8192C34.9829 21.6971 33.8149 22.1815 32.5724 22.1815C31.3304 22.1815 30.1625 21.6977 29.284 20.8192C27.4708 19.0055 27.4708 16.0556 29.284 14.2419C31.0983 12.4287 34.0487 12.4299 35.8608 14.2419C36.7392 15.1198 37.2236 16.2877 37.2236 17.5303C37.2236 18.7728 36.7398 19.9408 35.8608 20.8192Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </Link>

                        <h2 className="mt-6 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                            <span className="font-normal">DUK</span>
                            InnoFest&apos;24
                        </h2>

                        <p className="mt-4 leading-relaxed text-white/90">
                            Login to continue (for team leaders)
                        </p>
                    </div>
                </section>

                <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
                    <div className="w-full lg:max-w-3xl">
                        <div className="relative -mt-16 block lg:hidden">
                            <Link
                                className="inline-flex size-16 items-center justify-center rounded-full bg-white text-blue-600 sm:size-20"
                                href="/"
                            >
                                <span className="sr-only">Home</span>

                                <svg
                                    className="h-8 sm:h-10"
                                    viewBox="0 0 51 50"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M50.0954 3.0813C50.0921 2.93266 50.0865 2.78403 50.081 2.63483C50.0748 2.46838 50.0698 2.30249 50.0609 2.13548C50.0437 1.80035 50.022 1.46355 49.9936 1.12563C49.9485 0.583972 49.5181 0.154204 48.9765 0.108555C48.6386 0.0801639 48.3029 0.0590095 47.9683 0.0411953C47.7985 0.0322882 47.6304 0.027278 47.4623 0.0211544C47.3164 0.0161441 47.17 0.0100205 47.0247 0.00723702C46.7814 0.00167008 46.5398 0 46.2988 0C46.2587 0 46.2181 1.10173e-09 46.178 0.000556695C41.3748 0.0239378 36.9658 1.20302 32.5145 3.63354C32.436 3.67696 32.3575 3.7176 32.279 3.76047C32.2512 3.77605 32.2239 3.78941 32.1961 3.805C32.1899 3.80834 32.1849 3.81391 32.1788 3.81725C28.5291 5.85141 24.8856 8.72228 21.1145 12.4933C20.6859 12.922 20.2667 13.3562 19.8519 13.7926L12.5236 14.3499C12.3093 14.366 12.1044 14.444 11.9335 14.5737L0.439474 23.321C0.0737261 23.5994 -0.0838183 24.0737 0.0436646 24.5151C0.170591 24.9566 0.555823 25.2744 1.01342 25.3162L11.7983 26.2899L15.213 29.7046C14.0028 29.9813 12.7697 30.6593 11.7136 31.7148C11.0812 32.3478 10.5735 33.057 10.2017 33.8319C9.71566 34.8613 8.64848 37.5117 7.51839 40.318L6.96671 41.6869C6.7997 42.1011 6.89601 42.5748 7.21221 42.8905C7.42487 43.1037 7.70989 43.2167 7.99993 43.2167C8.13966 43.2167 8.28106 43.19 8.41634 43.1354L9.83424 42.5637C12.6177 41.4425 15.247 40.3831 16.2785 39.8971C17.0468 39.5275 17.7565 39.0198 18.3884 38.3879C19.4439 37.3324 20.1214 36.0994 20.3981 34.8891L23.7115 38.2025L24.6852 48.9868C24.7263 49.4444 25.0448 49.8297 25.4862 49.9566C25.5881 49.9861 25.6917 50 25.7941 50C26.1359 50 26.466 49.8425 26.6803 49.5608L35.4266 38.0673C35.5563 37.8964 35.6342 37.6915 35.6503 37.4772L36.1909 30.3654C36.668 29.9139 37.1406 29.4552 37.6088 28.9876C41.3826 25.2138 44.2552 21.5685 46.2899 17.9166C46.2921 17.9127 46.2954 17.9094 46.2977 17.9055C46.3077 17.8877 46.316 17.8704 46.3261 17.8526C46.419 17.685 46.5075 17.5175 46.5966 17.3494C48.9386 12.981 50.0765 8.64545 50.101 3.9336C50.1016 3.88739 50.1016 3.84174 50.1016 3.79554C50.1027 3.55894 50.101 3.32068 50.0954 3.0813ZM35.8608 20.8192C34.9829 21.6971 33.8149 22.1815 32.5724 22.1815C31.3304 22.1815 30.1625 21.6977 29.284 20.8192C27.4708 19.0055 27.4708 16.0556 29.284 14.2419C31.0983 12.4287 34.0487 12.4299 35.8608 14.2419C36.7392 15.1198 37.2236 16.2877 37.2236 17.5303C37.2236 18.7728 36.7398 19.9408 35.8608 20.8192Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </Link>

                            <Link href={"/"}>
                                <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">
                                    <span className="font-normal">DUK</span>
                                    InnoFest&apos;24
                                </h1>
                            </Link>

                            <p className="mt-4 leading-relaxed text-gray-500">
                                Login to continue (for team leaders)
                            </p>
                            <p className="mt-4 leading-relaxed text-sm text-gray-500">
                                Please confirm your email before logging in (if
                                not done). Please check your inbox for a
                                confirmation email.
                            </p>
                        </div>

                        <form
                            onSubmit={handleSignUp}
                            className="mt-2 grid grid-cols-6 gap-6"
                        >
                            <Link
                                className="text-gray-600 flex items-center space-x-4"
                                href="/"
                            >
                                <div className="text-3xl font-bold hidden md:block">
                                    <span className="font-normal">DUK</span>
                                    InnoFest&apos;24
                                </div>
                            </Link>
                            <div className="col-span-6 text-sm hidden lg:block">
                                Please confirm your email before logging in (if
                                not done). <br />
                                Please check your inbox for a confirmation
                                email.
                            </div>
                            <div className="col-span-6">
                                <label
                                    htmlFor="Email"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Email
                                </label>

                                <Input
                                    type="email"
                                    id="Email"
                                    name="email"
                                    placeholder="john.doe@duk.ac.in"
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm"
                                />
                            </div>

                            <div className="col-span-6">
                                <label
                                    htmlFor="Password"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Password
                                </label>

                                <Input
                                    type="password"
                                    id="Password"
                                    name="password"
                                    placeholder="********"
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm"
                                />
                            </div>

                            <div className="col-span-6 sm:flex sm:items-center flex flex-col space-y-4">
                                <Button
                                    className="w-full"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Logging in..." : "Login"}
                                </Button>
                                <p className="mt-4 text-sm text-gray-500 sm:mt-0">
                                    Don&apos;t have an account?{" "}
                                    <Link
                                        href="/signup"
                                        className="text-gray-700 underline"
                                    >
                                        Sign up
                                    </Link>
                                    .
                                </p>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </section>
    );
}
