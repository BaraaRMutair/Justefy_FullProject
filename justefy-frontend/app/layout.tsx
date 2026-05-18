import "./globals.css";
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";

import ConditionalLayout from "./main/components/ConditionalLayout";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-poppins",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Justefy | Digital Marketing Agency",
    description:
        "Justefy - Your premium digital marketing partner. Social Media Ads, Google Ads, SEO, Branding, and Web Development.",
    keywords: [
        "digital marketing",
        "social media ads",
        "google ads",
        "SEO",
        "branding",
        "web development",
        "Justefy",
    ],
    authors: [{ name: "Justefy Agency" }],
    openGraph: {
        title: "Justefy | Digital Marketing Agency",
        description: "Premium digital marketing solutions for your business growth",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="ar"
            dir="rtl"
            className={`${inter.variable} ${poppins.variable}`}
        >
            <body className="font-sans bg-hero-gradient min-h-screen flex flex-col">

                <ConditionalLayout>
                    {children}
                </ConditionalLayout>

            </body>
        </html>
    );
}