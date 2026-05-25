"use client";

import { motion } from "framer-motion";
import {
    ArrowLeft,
    ShieldCheck,
    Clock3,
    CheckCircle2,
    MousePointerClick,
    BarChart3,
    TrendingUp,
} from "lucide-react";

import Link from "next/link";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden pt-24">
            {/* Background */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-justefy-200/20 blur-3xl" />

                <div className="absolute bottom-10 left-10 h-96 w-96 rounded-full bg-justefy-300/10 blur-3xl" />

                <div className="absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-justefy-100/20 blur-3xl" />
            </div>

            <div className="container relative">
                <div className="grid items-center gap-16 lg:grid-cols-2">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                        className="space-y-8"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="inline-flex items-center gap-2 rounded-full border border-justefy-200 bg-white/80 px-4 py-2 text-sm font-medium text-justefy-700 backdrop-blur-md shadow-sm"
                        >
                            <BarChart3 className="h-4 w-4" />
                            حلول تسويق رقمي احترافية
                        </motion.div>

                        {/* Heading */}
                        <div className="space-y-5">
                            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-justefy-900 md:text-6xl lg:text-7xl">
                                نساعدك على تحقيق{" "}
                                <span className="bg-gradient-to-l from-justefy-500 to-justefy-700 bg-clip-text text-transparent">
                                    نمو حقيقي
                                </span>
                            </h1>

                            <p className="max-w-2xl text-lg leading-relaxed text-justefy-600 md:text-xl">
                                في <strong>Justefy</strong> نقدم حلول تسويق
                                رقمي تساعدك على زيادة العملاء، تحسين الظهور،
                                وتحقيق نتائج قابلة للقياس عبر الحملات
                                الإعلانية وإدارة المحتوى والتحليلات.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <Link
                                href="#contact"
                                className="group inline-flex items-center justify-center gap-2 rounded-full bg-justefy-500 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-justefy-600 hover:shadow-lg"
                            >
                                ابدأ الآن

                                <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
                            </Link>

                            <Link
                                href="#services"
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-justefy-200 bg-white/90 px-8 py-4 text-lg font-semibold text-justefy-700 backdrop-blur-md transition-all duration-300 hover:bg-white hover:shadow-md"
                            >
                                استكشف خدماتنا
                            </Link>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap items-center gap-6 pt-2">
                            <div className="flex items-center gap-2 text-sm text-justefy-600">
                                <ShieldCheck className="h-4 w-4 text-justefy-500" />
                                <span>نتائج موثوقة</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-justefy-600">
                                <Clock3 className="h-4 w-4 text-justefy-500" />
                                <span>متابعة مستمرة</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-justefy-600">
                                <BarChart3 className="h-4 w-4 text-justefy-500" />
                                <span>تحليلات دقيقة</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Dashboard */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="rounded-[32px] border border-white/40 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
                            {/* Header */}
                            <div className="mb-8 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-justefy-500 to-justefy-700 shadow-lg">
                                        <TrendingUp className="h-5 w-5 text-white" />
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-justefy-800">
                                            لوحة التحكم
                                        </h3>

                                        <p className="text-xs text-justefy-400">
                                            إحصائيات الأداء
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-400" />
                                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                                    <div className="h-3 w-3 rounded-full bg-green-400" />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mb-6 grid grid-cols-3 gap-4">
                                {[
                                    {
                                        label: "الزيارات",
                                        value: "12.5K",
                                        change: "+23%",
                                    },
                                    {
                                        label: "العملاء",
                                        value: "3,240",
                                        change: "+18%",
                                    },
                                    {
                                        label: "العائد",
                                        value: "3.8x",
                                        change: "+12%",
                                    },
                                ].map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="rounded-2xl border border-white/40 bg-white/70 p-4 text-center shadow-sm backdrop-blur-md"
                                    >
                                        <p className="text-2xl font-bold text-justefy-800">
                                            {stat.value}
                                        </p>

                                        <p className="mt-1 text-xs text-justefy-500">
                                            {stat.label}
                                        </p>

                                        <span className="mt-1 inline-block text-xs font-semibold text-green-600">
                                            {stat.change}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Chart */}
                            <div className="flex h-44 items-end justify-around gap-2 rounded-2xl bg-justefy-50/70 p-4">
                                {[35, 60, 45, 75, 50, 90, 70, 85, 55, 78].map(
                                    (height, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 0 }}
                                            animate={{
                                                height: `${height}%`,
                                            }}
                                            transition={{
                                                delay: 0.4 + i * 0.07,
                                                duration: 0.5,
                                            }}
                                            className="w-full rounded-t-xl bg-gradient-to-t from-justefy-500 to-justefy-300"
                                        />
                                    )
                                )}
                            </div>

                            {/* Footer */}
                            <div className="mt-5 flex items-center justify-between">
                                <p className="text-sm text-justefy-500">
                                    أداء الحساب الشهري
                                </p>

                                <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                                    <CheckCircle2 className="h-4 w-4" />
                                    +156% نمو
                                </div>
                            </div>
                        </div>

                        {/* Floating Card 1 */}
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="absolute -left-6 -top-6 rounded-2xl border border-white/40 bg-white/90 p-4 shadow-lg backdrop-blur-xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                </div>

                                <div>
                                    <p className="text-xs text-justefy-400">
                                        حالة الحساب
                                    </p>

                                    <p className="text-sm font-semibold text-green-600">
                                        نشط
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Floating Card 2 */}
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{
                                duration: 6,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 1,
                            }}
                            className="absolute -bottom-5 -right-5 rounded-2xl border border-white/40 bg-white/90 p-4 shadow-lg backdrop-blur-xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-justefy-100">
                                    <MousePointerClick className="h-5 w-5 text-justefy-600" />
                                </div>

                                <div>
                                    <p className="text-xs text-justefy-400">
                                        معدل التفاعل
                                    </p>

                                    <p className="text-sm font-semibold text-justefy-700">
                                        4.2%
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}