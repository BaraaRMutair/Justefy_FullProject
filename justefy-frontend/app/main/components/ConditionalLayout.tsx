"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatBot from "./ChatBot";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const isAuth =
        pathname === "/auth/login" ||
        pathname === "/auth/register";
    const isDashboard = pathname ? pathname.startsWith("/dashboard") : false;

    if (isAuth || isDashboard) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <ChatBot />
        </div>
    );
}