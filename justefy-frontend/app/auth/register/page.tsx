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
    User,
    Phone,
    UserPlus,
    Sparkles
} from "lucide-react";

// ================= Schema =================
const schema = z.object({
    fullName: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    phone: z.string().min(8, "رقم الهاتف غير صالح"),
    password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "كلمة المرور غير متطابقة",
});

type FormData = z.infer<typeof schema>;

// ================= Component =================
export default function RegisterPage() {
    const router = useRouter();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    // ================= Submit =================
    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setApiError(null);

        try {
            // ❗ حذف confirmPassword قبل الإرسال
            const { confirmPassword, ...cleanData } = data;
            const API_URL = process.env.NEXT_PUBLIC_API_URL;

            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(cleanData),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || "فشل إنشاء الحساب");
            }

            // ✅ Redirect بعد النجاح
            router.push("/auth/login");

        } catch (err) {
            if (err instanceof Error) {
                setApiError(err.message);
            } else {
                setApiError("حدث خطأ غير متوقع");
            }
        } finally {
            setLoading(false);
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
                        <UserPlus className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">إنشاء حساب</h1>
                    <p className="text-gray-500 text-sm">ابدأ رحلتك معنا</p>
                </div>

                {/* Error */}
                {apiError && (
                    <div className="bg-red-100 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
                        {apiError}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    {/* Full Name */}
                    <div>
                        <div className="relative">
                            <User className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                {...register("fullName")}
                                className="w-full pr-10 py-3 rounded-lg border focus:ring-2 focus:ring-justefy-400"
                                placeholder="الاسم الكامل"
                            />
                        </div>
                        {errors.fullName && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {errors.fullName.message}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <div className="relative">
                            <Mail className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                {...register("email")}
                                type="email"
                                className="w-full pr-10 py-3 rounded-lg border focus:ring-2 focus:ring-justefy-400"
                                placeholder="email@mail.com"
                            />
                        </div>
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                        <div className="relative">
                            <Phone className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                {...register("phone")}
                                className="w-full pr-10 py-3 rounded-lg border focus:ring-2 focus:ring-justefy-400"
                                placeholder="059xxxxxxxx"
                            />
                        </div>
                        {errors.phone && (
                            <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <Lock className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            {...register("password")}
                            type={showPassword ? "text" : "password"}
                            className="w-full pr-10 pl-10 py-3 rounded-lg border focus:ring-2 focus:ring-justefy-400"
                            placeholder="كلمة المرور"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-3"
                        >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </button>
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                        <Lock className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            {...register("confirmPassword")}
                            type={showConfirm ? "text" : "password"}
                            className="w-full pr-10 pl-10 py-3 rounded-lg border focus:ring-2 focus:ring-justefy-400"
                            placeholder="تأكيد كلمة المرور"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute left-3 top-3"
                        >
                            {showConfirm ? <EyeOff /> : <Eye />}
                        </button>
                    </div>

                    {errors.confirmPassword && (
                        <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-justefy-500 text-white rounded-lg hover:bg-justefy-600 transition disabled:opacity-50"
                    >
                        {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-sm mt-6 text-gray-600">
                    لديك حساب؟{" "}
                    <Link href="/auth/login" className="text-justefy-500 font-medium">
                        تسجيل الدخول
                    </Link>
                </p>
            </div>
        </motion.div>
    );
}