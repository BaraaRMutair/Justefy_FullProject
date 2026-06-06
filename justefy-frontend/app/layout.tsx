import "./globals.css";
import type { Metadata } from "next";
import { Alexandria } from "next/font/google";

import ConditionalLayout from "./main/components/ConditionalLayout";

const alexandria = Alexandria({
    subsets: ["arabic", "latin"],
    weight: ["300", "400", "500", "600", "700", "800"],
    variable: "--font-alexandria",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL("https://justefy-frontend.vercel.app"),

    title: {
        default: "Justefy | Digital Marketing Agency",
        template: "%s | Justefy",
    },

    description:
        "Justefy is a premium digital marketing agency specializing in Social Media Ads, Google Ads, SEO, Branding, and Web Development.",

    keywords: [
        "Justefy",
        "Digital Marketing",
        "Social Media Ads",
        "Google Ads",
        "SEO",
        "Branding",
        "Web Development",
        "Marketing Agency",
    ],

    authors: [{ name: "Justefy Agency" }],

    creator: "Justefy Agency",

    openGraph: {
        title: "Justefy | Digital Marketing Agency",
        description:
            "Premium digital marketing solutions designed to grow your business.",
        url: "https://justefy-frontend.vercel.app",
        siteName: "Justefy",
        locale: "ar_SA", // ✅ تم التصحيح
        type: "website",
    },

    twitter: {
        card: "summary_large_image",
        title: "Justefy | Digital Marketing Agency",
        description:
            "Premium digital marketing solutions designed to grow your business.",
    },

    icons: {
        icon: "/favicon.ico",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="ar"
            dir="rtl"
            suppressHydrationWarning
            className={alexandria.variable}
        >
            <body
                className="
                    font-sans
                    antialiased
                    bg-hero-gradient
                    text-justefy-900
                    min-h-screen
                    overflow-x-hidden
                    touch-pan-y
                "
            >
                <ConditionalLayout>
                    {children}
                </ConditionalLayout>
            </body>
        </html>
    );
}