"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Clock3, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Hero() {
    return (
        <section id="hero" className="scroll-mt-20 sm:scroll-mt-24 relative min-h-[85vh] sm:min-h-screen flex items-center justify-center overflow-hidden pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 text-center px-4 sm:px-6">
            {/* Background */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-10 sm:top-20 right-4 sm:right-10 h-48 w-48 sm:h-72 sm:w-72 rounded-full bg-justefy-200/20 blur-3xl" />
                <div className="absolute bottom-4 sm:bottom-10 left-4 sm:left-10 h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-justefy-300/10 blur-3xl" />
                <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] sm:h-[500px] sm:w-[500px] md:h-[650px] md:w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-justefy-100/20 blur-3xl" />
            </div>

            <div className="w-full max-w-7xl mx-auto relative">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="flex flex-col items-center space-y-6 sm:space-y-8"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-justefy-200 bg-white/80 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-justefy-700 backdrop-blur-md shadow-sm">
                        <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        حلول تسويق رقمي احترافية
                    </div>

                    {/* Heading & Text */}
                    <div className="space-y-4 sm:space-y-5 flex flex-col items-center max-w-3xl mx-auto">
                        {/* ✅ font-bold + leading-normal + tracking-wide */}
<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-normal tracking-wide text-justefy-900 px-1 sm:px-2 text-balance">
    نساعدك على تحقيق{" "}
    <span 
        className="text-transparent bg-clip-text bg-gradient-to-l from-justefy-500 to-justefy-700 pb-2 -mb-2 inline-block"
        style={{ paddingBottom: '0.2em', marginBottom: '-0.2em' }}
    >
        نمو حقيقي
    </span>
</h1>          
                        <p className="max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-justefy-600 px-2 sm:px-4 text-balance">
                            في <strong>Justefy</strong> نقدم حلول تسويق رقمي تساعدك على زيادة العملاء، 
                            تحسين الظهور، وتحقيق نتائج قابلة للقياس عبر الحملات الإعلانية وإدارة المحتوى والتحليلات.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full justify-center px-4 sm:px-0 max-w-xs sm:max-w-none mx-auto">
                        <Link
                            href="#contact"
                            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-justefy-500 px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-justefy-600 hover:shadow-lg"
                        >
                            ابدأ الآن
                        </Link>
                        <Link
                            href="#services"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-justefy-200 bg-white/90 px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg font-semibold text-justefy-700 backdrop-blur-md transition-all duration-300 hover:bg-white hover:shadow-md"
                        >
                            استكشف خدماتنا
                        </Link>
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center justify-center gap-3 sm:gap-6 md:gap-8 pt-4 sm:pt-6 w-full px-4">
                        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-justefy-600 bg-white/50 sm:bg-transparent py-2 rounded-xl sm:py-0">
                            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-justefy-500" />
                            <span>نتائج موثوقة</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-justefy-600 bg-white/50 sm:bg-transparent py-2 rounded-xl sm:py-0">
                            <Clock3 className="h-4 w-4 sm:h-5 sm:w-5 text-justefy-500" />
                            <span>متابعة مستمرة</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-justefy-600 bg-white/50 sm:bg-transparent py-2 rounded-xl sm:py-0">
                            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-justefy-500" />
                            <span>تحليلات دقيقة</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}