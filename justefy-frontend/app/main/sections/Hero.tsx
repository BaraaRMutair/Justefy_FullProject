"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Clock3, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 text-center">
            {/* Background */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-justefy-200/20 blur-3xl" />
                <div className="absolute bottom-10 left-10 h-96 w-96 rounded-full bg-justefy-300/10 blur-3xl" />
                <div className="absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-justefy-100/20 blur-3xl" />
            </div>

            <div className="container relative px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="flex flex-col items-center space-y-8"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-justefy-200 bg-white/80 px-4 py-2 text-sm font-medium text-justefy-700 backdrop-blur-md shadow-sm">
                        <BarChart3 className="h-4 w-4" />
                        حلول تسويق رقمي احترافية
                    </div>

                    {/* Heading & Text */}
                    <div className="space-y-5 flex flex-col items-center">
                        <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-justefy-900 md:text-6xl lg:text-7xl">
                            نساعدك على تحقيق{" "}
                            <span className="bg-gradient-to-l from-justefy-500 to-justefy-700 bg-clip-text text-transparent">
                                نمو حقيقي
                            </span>
                        </h1>
                        <p className="max-w-2xl text-lg leading-relaxed text-justefy-600 md:text-xl">
                            في <strong>Justefy</strong> نقدم حلول تسويق رقمي تساعدك على زيادة العملاء، 
                            تحسين الظهور، وتحقيق نتائج قابلة للقياس عبر الحملات الإعلانية وإدارة المحتوى والتحليلات.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Link
                            href="#contact"
                            className="group inline-flex items-center justify-center gap-2 rounded-full bg-justefy-500 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-justefy-600 hover:shadow-lg"
                        >
                            ابدأ الآن
                        </Link>
                        <Link
                            href="#services"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-justefy-200 bg-white/90 px-8 py-4 text-lg font-semibold text-justefy-700 backdrop-blur-md transition-all duration-300 hover:bg-white hover:shadow-md"
                        >
                            استكشف خدماتنا
                        </Link>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
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
            </div>
        </section>
    );
}