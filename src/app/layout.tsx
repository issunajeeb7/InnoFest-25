import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/context/SessionContext";
import { cn } from "@/lib/utils";

const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata: Metadata = {
    metadataBase: new URL("https://innofest.vercel.app"),
    title: "DUKInnoFest'24 Portal",
    description: "Your all-in-one portal for DUKInnoFest 2024 edition",
    openGraph: {
        title: "DUKInnoFest'24 Portal",
        description: "Your all-in-one portal for DUKInnoFest 2024 edition",
        url: "https://innofest.vercel.app/",
        siteName: "DUKInnoFest 2024",
        images: [
            {
                url: "/opengraph-image.png",
                width: 1200,
                height: 630,
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "DUKInnoFest'24 Portal",
        description: "Your all-in-one portal for DUKInnoFest 2024 edition",
        images: ["/twitter-image.png"],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <SessionProvider>
                <body
                    className={cn(
                        "min-h-screen bg-background font-sans antialiased",
                        fontSans.variable
                    )}
                >
                    {children}
                    <Toaster />
                </body>
            </SessionProvider>
        </html>
    );
}
