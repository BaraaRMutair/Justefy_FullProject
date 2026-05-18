"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
    { href: "#services", label: "خدماتنا" },
    { href: "#portfolio", label: "أعمالنا" },
    { href: "#testimonials", label: "أراء العملاء" },
    { href: "#contact", label: "تواصل معنا" },
];

export default function Navbar() {
    const pathname = usePathname();
    const isDashboard = pathname.startsWith("/dashboard");

    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        setUserRole(localStorage.getItem("user_role"));
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
                    ? (isDashboard ? "bg-gray-950/90 border-gray-800" : "bg-white/80 border-justefy-100") + " backdrop-blur-xl shadow-lg border-b"
                    : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo - Justefy */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-justefy-400 to-justefy-600 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className={`text-2xl font-black tracking-tighter ${isDashboard ? "text-white" : "text-justefy-900"}`}>
                            Justefy
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {/* لا تظهر الروابط العادية إذا كنا في الداشبورد لتقليل الزحمة */}
                        {!isDashboard && navLinks.map((link) => (
                            <Link key={link.href} href={link.href} className="text-sm font-bold text-justefy-700 hover:text-justefy-500 transition-colors">
                                {link.label}
                            </Link>
                        ))}

                        {/* زر لوحة التحكم للأدمن فقط */}
                        {userRole === "admin" && (
                            <Link href="/dashboard" className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-2xl transition-all shadow-xl ${isDashboard
                                    ? "bg-white text-black hover:bg-gray-200"
                                    : "bg-justefy-500 text-white hover:bg-justefy-600 hover:shadow-justefy-500/40"
                                }`}>
                                <LayoutDashboard className="w-4 h-4" />
                                {isDashboard ? "لوحة الإدارة" : "لوحة التحكم"}
                            </Link>
                        )}
                    </nav>

                    {/* Auth Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {!userRole ? (
                            <Link href="/auth/login" className="px-6 py-2.5 bg-justefy-500 text-white rounded-full text-sm font-bold hover:bg-justefy-600 shadow-lg shadow-justefy-500/20 transition-all">
                                تسجيل الدخول
                            </Link>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full transition-all border ${isDashboard
                                        ? "text-red-400 border-red-400/30 hover:bg-red-400/10"
                                        : "text-red-500 border-red-100 hover:bg-red-50"
                                    }`}
                            >
                                <LogOut className="w-4 h-4" />
                                خروج
                            </button>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`md:hidden p-2 ${isDashboard ? "text-white" : "text-justefy-700"}`}>
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`md:hidden border-t p-6 space-y-4 shadow-2xl ${isDashboard ? "bg-gray-950 text-white border-gray-800" : "bg-white"}`}
                    >
                        {!isDashboard && navLinks.map((link) => (
                            <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="block text-justefy-700 font-bold py-2">
                                {link.label}
                            </Link>
                        ))}
                        {userRole === "admin" && (
                            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block text-justefy-600 font-black border-t border-gray-800 pt-4">
                                📊 لوحة الإدارة
                            </Link>
                        )}
                        <button onClick={handleLogout} className="w-full text-center py-4 text-red-500 font-bold bg-red-500/5 rounded-2xl">خروج</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}