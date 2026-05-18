import { Inter, Poppins } from "next/font/google";
import { Metadata } from "next";
import Link from "next/link";
import { Zap } from "lucide-react";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-poppins",
});

export const metadata: Metadata = {
    title: "Justefy | Authentication",
    description: "Sign in or create your Justefy account",
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className={`${inter.variable} ${poppins.variable} font-sans min-h-screen bg-hero-gradient flex items-center justify-center p-4 relative overflow-hidden`}
        >
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-justefy-200/40 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-justefy-300/30 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-justefy-100/30 rounded-full blur-3xl" />
            </div>

            {/* Logo */}
            <div className="absolute top-8 right-8 z-10">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-justefy-400 to-justefy-600 flex items-center justify-center shadow-lg">
                        <Zap className="w-5 h-5 text-white" />
                    </div>

                    <span className="text-2xl font-bold font-display text-justefy-800">
                        Justefy
                    </span>
                </Link>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-md">
                {children}
            </div>
        </div>
    );
}