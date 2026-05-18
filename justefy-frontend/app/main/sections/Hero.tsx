"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Shield, Clock } from "lucide-react";
import Link from "next/link";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 right-10 w-72 h-72 bg-justefy-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-10 w-96 h-96 bg-justefy-300/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-justefy-100/40 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-8"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-justefy-100/80 rounded-full text-justefy-700 text-sm font-medium"
                        >
                            <Sparkles className="w-4 h-4" />
                            وكالة تسويق رقمي متكاملة
                        </motion.div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-tight text-justefy-900">
                            نُحوّل أفكارك إلى{" "}
                            <span className="gradient-text">نتائج ملموسة</span>
                        </h1>

                        <p className="text-lg md:text-xl text-justefy-600 leading-relaxed max-w-xl">
                            في <strong>Justefy</strong>، نصنع حملات إعلانية ذكية تجذب عملاءك المستهدفين
                            وتُحقق أعلى عائد على الاستثمار. من الإعلانات إلى التحويلات، نحن معك في كل خطوة.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="#contact"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-justefy-500 text-white rounded-full text-lg font-semibold hover:bg-justefy-600 transition-all duration-300 hover:shadow-xl hover:shadow-justefy-500/30 btn-lift group"
                            >
                                ابدأ حملتك الآن
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="#services"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/80 backdrop-blur text-justefy-700 rounded-full text-lg font-semibold border border-justefy-200 hover:bg-white transition-all duration-300 btn-lift"
                            >
                                استكشف خدماتنا
                            </Link>
                        </div>

                        {/* Trust badges */}
                        <div className="flex items-center gap-6 pt-4">
                            <div className="flex items-center gap-2 text-sm text-justefy-500">
                                <Shield className="w-4 h-4 text-justefy-500" />
                                <span>ضمان النتائج</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-justefy-500">
                                <Clock className="w-4 h-4 text-justefy-500" />
                                <span>دعم 24/7</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-justefy-500">
                                <Sparkles className="w-4 h-4 text-justefy-500" />
                                <span>تقارير أسبوعية</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Content - Dashboard Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                        className="relative"
                    >
                        <div className="relative glass-card rounded-3xl p-6 shadow-2xl animate-float">
                            {/* Dashboard Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-justefy-400 to-justefy-600 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-justefy-800">لوحة التحكم</h3>
                                        <p className="text-xs text-justefy-400">آخر تحديث: الآن</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                {[
                                    { label: "الزيارات", value: "12.5K", change: "+23%" },
                                    { label: "التحويلات", value: "3,240", change: "+18%" },
                                    { label: "العائد", value: "0.03", change: "+12%" },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-justefy-50/50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-justefy-800">{stat.value}</p>
                                        <p className="text-xs text-justefy-500 mb-1">{stat.label}</p>
                                        <span className="text-xs text-green-500 font-medium">{stat.change}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Chart Placeholder */}
                            <div className="bg-justefy-50/50 rounded-xl p-4 h-40 flex items-end justify-around gap-2">
                                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((height, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                                        className="w-full bg-gradient-to-t from-justefy-400 to-justefy-300 rounded-t-sm"
                                    />
                                ))}
                            </div>

                            {/* Bottom Info */}
                            <div className="mt-4 flex items-center justify-between text-sm">
                                <span className="text-justefy-500">أداء الحملة الشهرية</span>
                                <span className="text-justefy-600 font-medium">+156% نمو</span>
                            </div>
                        </div>

                        {/* Floating elements */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-6 -left-6 glass-card rounded-2xl p-4 shadow-xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-justefy-400">حالة الحملة</p>
                                    <p className="text-sm font-semibold text-green-600">نشطة ✅</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -bottom-4 -right-4 glass-card rounded-2xl p-4 shadow-xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-justefy-100 flex items-center justify-center">
                                    <ArrowLeft className="w-4 h-4 text-justefy-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-justefy-400">معدل النقر</p>
                                    <p className="text-sm font-semibold text-justefy-700">4.2%</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}