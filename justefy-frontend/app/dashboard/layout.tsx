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

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role !== "admin") {
      router.replace("/"); // استخدام replace أفضل من push في الحماية
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) return null;

  return (
    <main className={`${ibmPlexArabic.className} min-h-screen bg-gray-950 text-white selection:bg-justefy-500/30`} dir="rtl">
      <Navbar />
      
      {/* تم زيادة المساحة العلوية pt-32 وحركة دخول ناعمة للمحتوى */}
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