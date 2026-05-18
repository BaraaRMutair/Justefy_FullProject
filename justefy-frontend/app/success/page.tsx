"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-10 text-white">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-10 shadow-2xl"
            >
                {/* Icon */}
                <div className="flex justify-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{
                            duration: 0.4,
                            type: "spring",
                        }}
                        className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center"
                    >
                        <CheckCircle2 className="w-12 h-12 text-green-400" />
                    </motion.div>
                </div>

                {/* Heading */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black mb-4">
                        تم تجهيز حسابك بنجاح 🚀
                    </h1>

                    <p className="text-slate-400 leading-relaxed text-lg">
                        أصبح بإمكانك الآن الوصول إلى لوحة التحكم وإدارة
                        حملاتك التسويقية ومتابعة تحليلات الأداء باستخدام أدوات Justefy الذكية.
                    </p>
                </div>

                {/* AI Insight Card */}
                <div className="mb-8 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
                    <div className="flex items-center gap-2 mb-3 text-orange-400">
                        <Sparkles className="w-5 h-5" />
                        <span className="font-bold">
                            تحليل Justefy AI
                        </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed">
                        اكتشفنا فرصًا لتحسين ظهور علامتك التجارية وزيادة
                        التفاعل مع جمهورك عبر استراتيجيات تسويق رقمية ذكية.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/dashboard" className="flex-1">
                        <button className="w-full py-4 rounded-2xl bg-justefy-500 hover:bg-justefy-600 transition font-bold flex items-center justify-center gap-2">
                            الانتقال إلى لوحة التحكم
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>

                    <Link href="/" className="flex-1">
                        <button className="w-full py-4 rounded-2xl border border-slate-700 hover:bg-slate-800 transition font-bold">
                            العودة للرئيسية
                        </button>
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}