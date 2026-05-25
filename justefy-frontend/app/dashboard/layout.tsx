"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IBM_Plex_Sans_Arabic } from "next/font/google"; 
import Navbar from "../main/components/Navbar";
import { motion } from "framer-motion";
import "../globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({ 
  subsets: ["arabic"], 
  weight: ["300", "400", "500", "700"],
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
  if (typeof window !== "undefined") {
    const role = localStorage.getItem("user_role");
    if (role === "admin") {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      router.replace("/auth/login"); // طرد مباشر لصفحة اللوجن
    }
    setCheckingAuth(false);
  }
}, [router]);

  // إذا جاري الفحص أو غير مصرح له، لا تعرض أي شيء في المتصفح لمنع الوميض أو الطردة المزدوجة
  if (checkingAuth || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-justefy-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className={`${ibmPlexArabic.className} min-h-screen bg-gray-950 text-white selection:bg-justefy-500/30`} dir="rtl">
      <Navbar />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-32 pb-20 px-6 lg:px-12 max-w-[1600px] mx-auto"
      >
        {children}
      </motion.div>
    </main>
  );
}