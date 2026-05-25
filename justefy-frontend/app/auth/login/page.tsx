"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    LogIn,
    Sparkles
} from "lucide-react";

// ================= Schema =================
const loginSchema = z.object({
    email: z.string().email("بريد إلكتروني غير صالح"),
    password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

type LoginFormData = z.infer<typeof loginSchema>;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ================= Component =================
export default function LoginPage() {
    const router = useRouter();

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    // ================= Submit =================
    // داخل دالة onSubmit في ملف login/page.tsx
const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });

        const result = await res.json();

        if (!res.ok) throw new Error(result.message || "فشل تسجيل الدخول");

        // ✅ حفظ البيانات والتوجه بشكل آمن وصارم
        if (result.user) {
            localStorage.setItem("user_role", result.user.role || "admin");
            
            // حماية الاسم من الـ null: إذا رجع من السيرفر فاضي، نضع اسم افتراضي فوراً
            const safeName = result.user.name || result.user.fullName || "Baraa";
            localStorage.setItem("user_name", safeName);

            // توجيه الأدمن وإيقاف بقية الدالة فوراً من خلال الـ return
            if (result.user.role === 'admin') {
                window.location.href = "/dashboard";
                return; 
            } else {
                window.location.href = "/";
                return;
            }
        }

        // في حال لم يكن هناك يوزر (خطة بديلة)
        router.push("/");
        router.refresh();

    } catch (err: any) {
        setApiError(err.message);
    } finally {
        setIsLoading(false);
    }
};
    // ================= UI =================
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center min-h-screen bg-gray-100 p-4"
        >
            <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl">

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-justefy-400 to-justefy-600 flex items-center justify-center">
                        <LogIn className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
                    <p className="text-gray-500 text-sm">أهلاً بك مجدداً</p>
                </div>

                {/* Error */}
                {apiError && (
                    <div className="bg-red-100 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
                        {apiError}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    {/* Email */}
                    <div>
                        <label className="text-sm text-gray-600">البريد الإلكتروني</label>
                        <div className="relative mt-1">
                            <Mail className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                {...register("email")}
                                type="email"
                                className="w-full pr-10 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-justefy-400"
                                placeholder="email@mail.com"
                            />
                        </div>
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="text-sm text-gray-600">كلمة المرور</label>
                        <div className="relative mt-1">
                            <Lock className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                {...register("password")}
                                type={showPassword ? "text" : "password"}
                                className="w-full pr-10 pl-10 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-justefy-400"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-3 top-3 text-gray-400"
                            >
                                {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-justefy-500 text-white rounded-lg hover:bg-justefy-600 transition disabled:opacity-50"
                    >
                        {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-sm mt-6 text-gray-600">
                    ليس لديك حساب؟{" "}
                    <Link href="/auth/register" className="text-justefy-500 font-medium">
                        إنشاء حساب
                    </Link>
                </p>
            </div>
        </motion.div>
    );
}