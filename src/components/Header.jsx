"use client";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { useSession } from "@/context/SessionContext";

export default function Header() {
    const router = useRouter();
    const { session, loading } = useSession();

    const getSession = useCallback(async () => {
        if (!loading && !session) {
            router.push("/");
            return false;
        }
    }, [loading, session, router]);

    useEffect(() => {
        (async () => {
            await getSession();
        })();
    }, [loading, session, router, getSession]);

    return (
        <header className="bg-white">
            <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8">
                <Link
                    className="text-gray-600 flex items-center space-x-4"
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
                    <div className="text-3xl font-bold hidden md:block">
                        <span className="font-normal">DUK</span>
                        InnoFest&apos;25
                    </div>
                    <div className="text-xl font-bold md:hidden">
                        <span className="font-normal">DUK</span>
                        InnoFest&apos;25
                    </div>
                </Link>

                <div className="flex flex-1 items-center justify-end md:justify-end">
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex sm:gap-4">
                            <Link
                                className="block rounded-md border-2 border-gray-800 px-5 py-2.5 text-sm font-medium text-black transition hover:border-gray-700"
                                href="/"
                            >
                                Home
                            </Link>
                            {session ? (
                                <Link
                                    className="block rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                                    href="/logout"
                                >
                                    Logout
                                </Link>
                            ) : (
                                <Link
                                    className="block rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                                    href="/login"
                                >
                                    Login
                                </Link>
                            )}
                        </div>

                        {/* Mobile menu */}
                        <Sheet>
                            <SheetTrigger className="md:hidden">
                                <span className="sr-only">Toggle menu</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="size-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Menu</SheetTitle>
                                    <SheetDescription className="flex flex-col space-y-4">
                                        <Link
                                            className="block rounded-md border-2 border-gray-800 px-5 py-2.5 text-sm font-medium text-black transition hover:border-gray-700"
                                            href="/"
                                        >
                                            Home
                                        </Link>
                                        {session ? (
                                            <Link
                                                className="block rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                                                href="/logout"
                                            >
                                                Logout
                                            </Link>
                                        ) : (
                                            <>
                                                <Link
                                                    className="block rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                                                    href="/login"
                                                >
                                                    Login
                                                </Link>
                                                <Link
                                                    className="block rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:text-gray-600/75"
                                                    href="/signup"
                                                >
                                                    Register
                                                </Link>
                                            </>
                                        )}
                                    </SheetDescription>
                                </SheetHeader>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
}
