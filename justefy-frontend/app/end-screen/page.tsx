"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    CheckCircle,
    MessageCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface LeadData {
    name: string;
    service: string;
    mode?: string;
}

export default function EndScreen() {

    const router = useRouter();

    const [leadData, setLeadData] =
        useState<LeadData | null>(null);

    // ==========================================
    // LOAD DATA & FIX SCROLL
    // ==========================================
    useEffect(() => {

        try {
            // إجبار المتصفح على الصعود لأعلى الصفحة فوراً لحل مشكلة التمرير المتبقي من الجوال
            window.scrollTo(0, 0);

            const stored =
                sessionStorage.getItem(
                    "justefy_contact_data"
                );

            if (!stored) {
                router.replace("/");
                return;
            }

            setLeadData(JSON.parse(stored));

        } catch (error) {

            console.error(error);

            router.replace("/");
        }

    }, [router]);

    // ==========================================
    // LOADING
    // ==========================================
    if (!leadData) {
        return null;
    }

    // ==========================================
    // WHATSAPP
    // ==========================================
    const whatsappNumber =
        "970598985831";

    const whatsappMessage =
        encodeURIComponent(
            `مرحباً Justefy 

أنا ${leadData.name}

قمت بإرسال طلب لخدمة:
${leadData.service}

وأرغب بالتواصل مع الفريق.`
        );

    const whatsappLink =
        `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    // ==========================================
    // MODE MESSAGE
    // ==========================================
    const successMessage =
        leadData.mode === "updated"
            ? "تم تعديل طلبك بنجاح ✅"
            : "تم استلام طلبك بنجاح ✅";

    return (
        <main
            className="
        min-h-dvh         /* تم التعديل هنا لحساب ارتفاع الشاشة ديناميكياً مع متصفحات الجوال */
        bg-gradient-to-br
        from-black
        via-slate-950
        to-slate-900
        flex
        items-center
        justify-center
        p-6
      "
            dir="rtl"
        >

            <motion.div
                initial={{
                    opacity: 0,
                    y: 30,
                    scale: 0.95,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                }}
                transition={{
                    duration: 0.5,
                }}
                className="
          w-full
          max-w-xl
          rounded-3xl
          border
          border-white/10
          bg-white/5
          backdrop-blur-xl
          p-10
          text-center
          shadow-2xl
        "
            >

                {/* ICON */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        delay: 0.2,
                        type: "spring",
                    }}
                    className="
            w-24
            h-24
            rounded-full
            bg-green-500/20
            flex
            items-center
            justify-center
            mx-auto
            mb-8
          "
                >
                    <CheckCircle
                        className="
              w-14
              h-14
              text-green-400
            "
                    />
                </motion.div>

                {/* TITLE */}
                <h1
                    className="
            text-3xl
            md:text-4xl
            font-bold
            text-white
            mb-4
          "
                >
                    {successMessage}
                </h1>

                {/* DESC */}
                <p
                    className="
            text-slate-300
            text-lg
            leading-relaxed
            mb-10
          "
                >
                    فريق Justefy سيقوم بالتواصل
                    معك بأقرب وقت ممكن.
                </p>

                {/* WHATSAPP */}
                <a
                    href={whatsappLink}
                    target="_blank"
                    className="
            inline-flex
            items-center
            gap-3
            bg-green-500
            hover:bg-green-600
            transition-all
            duration-300
            px-8
            py-4
            rounded-2xl
            text-white
            font-semibold
            text-lg
            shadow-lg
            hover:scale-105
          "
                >
                    <MessageCircle className="w-6 h-6" />

                    التواصل عبر واتساب
                </a>

            </motion.div>
        </main>
    );
}