"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Send, Phone, Mail, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

const servicesList = [
  "إعلانات السوشيال ميديا (Meta & TikTok)",
  "إعلانات جوجل (Google Ads)",
  "إعلانات واتساب",
  "تحسين محركات البحث (SEO)",
  "تعزيز الهوية البصرية",
  "بناء وتطوير المواقع",
] as const;

const contactSchema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().min(8, "رقم الهاتف مطلوب"),
  service: z.enum(servicesList, { errorMap: () => ({ message: "يرجى اختيار خدمة صالحة من القائمة" }) }),
  message: z.string().min(10, "الرسالة قصيرة جدًا"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const email = data.email.trim().toLowerCase();
      const lastSubmit = sessionStorage.getItem(`lead_${email}`);
      const now = Date.now();

      if (lastSubmit && now - Number(lastSubmit) < 60000) {
        alert("تم إرسال طلبك مؤخراً، انتظر قليلاً.");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/leads`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            email,
            phone: data.phone,
            service: data.service,
            notes: data.message,
            source: "website_form",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed To Submit Lead");

      const result = await response.json();

      sessionStorage.setItem(`lead_${email}`, String(Date.now()));
      sessionStorage.setItem(
        "justefy_contact_data",
        JSON.stringify({
          mode: result?.mode || "created",
          leadId: result?.leadId || null,
          email,
          name: data.name,
          service: data.service,
        })
      );

      reset();
      router.push("/end-screen");
    } catch (error) {
      console.error("❌ Contact Form Error:", error);
      alert("حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
<section id="contact" className="scroll-mt-20 sm:scroll-mt-24 py-12 sm:py-16 md:py-20 lg:py-24 bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-justefy-100 rounded-full text-justefy-600 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            تواصل معنا
          </span>
<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-normal tracking-wide font-display text-justefy-900 mb-4 sm:mb-6">
    لنبدأ <span className="gradient-text">رحلة النجاح</span> معنا
</h2>
          <p className="text-sm sm:text-base lg:text-lg text-justefy-500 max-w-2xl mx-auto px-2">
            املأ النموذج أدناه وسيقوم فريقنا بالتواصل معك خلال 24 ساعة.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* CONTACT INFO */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-6 sm:space-y-8"
          >
            <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white/80 border border-white/20 shadow-md">
              <h3 className="text-xl sm:text-2xl font-bold text-justefy-800 mb-4 sm:mb-6">معلومات التواصل</h3>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-justefy-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-justefy-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-justefy-400 mb-0.5 sm:mb-1">الهاتف</p>
                    <p className="text-sm sm:text-base text-justefy-800 font-semibold" dir="ltr">+970 598 985 831</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-justefy-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-justefy-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-justefy-400 mb-0.5 sm:mb-1">البريد الإلكتروني</p>
                    <p className="text-sm sm:text-base text-justefy-800 font-semibold">hello@justefy.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-justefy-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-justefy-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-justefy-400 mb-0.5 sm:mb-1">الموقع</p>
                    <p className="text-sm sm:text-base text-justefy-800 font-semibold">فلسطين</p>
                  </div>
                </div>
              </div>
            </div>

            {/* STATS */}
            <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white/80 border border-white/20 shadow-md">
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold gradient-text">500+</p>
                  <p className="text-xs sm:text-sm text-justefy-500 mt-1">عميل سعيد</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold gradient-text">98%</p>
                  <p className="text-xs sm:text-sm text-justefy-500 mt-1">معدل الرضا</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* FORM */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 bg-white/80 border border-white/20 shadow-md"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-justefy-700 mb-1.5 sm:mb-2">الاسم الكامل *</label>
                  <input
                    {...register("name")}
                    type="text"
                    placeholder="بشار قديح"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-justefy-200 bg-white/50 focus:border-justefy-500 focus:ring-2 focus:ring-justefy-200 outline-none transition-all text-sm sm:text-base"
                  />
                  {errors.name && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-justefy-700 mb-1.5 sm:mb-2">البريد الإلكتروني *</label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="example@email.com"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-justefy-200 bg-white/50 focus:border-justefy-500 focus:ring-2 focus:ring-justefy-200 outline-none transition-all text-sm sm:text-base"
                  />
                  {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-justefy-700 mb-1.5 sm:mb-2">رقم الهاتف *</label>
                  <input
                    {...register("phone")}
                    type="tel"
                    placeholder="+970 59 123 4567"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-justefy-200 bg-white/50 focus:border-justefy-500 focus:ring-2 focus:ring-justefy-200 outline-none transition-all text-sm sm:text-base"
                  />
                  {errors.phone && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-justefy-700 mb-1.5 sm:mb-2">الخدمة المطلوبة *</label>
                  <select
                    {...register("service")}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-justefy-200 bg-white/50 focus:border-justefy-500 focus:ring-2 focus:ring-justefy-200 outline-none transition-all text-sm sm:text-base"
                  >
                    <option value="">اختر الخدمة...</option>
                    {servicesList.map((service) => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                  {errors.service && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.service.message}</p>}
                </div>
              </div>

              <div className="mb-6 sm:mb-8">
                <label className="block text-xs sm:text-sm font-medium text-justefy-700 mb-1.5 sm:mb-2">تفاصيل إضافية</label>
                <textarea
                  {...register("message")}
                  rows={4}
                  placeholder="أخبرنا أكثر عن مشروعك..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-justefy-200 bg-white/50 focus:border-justefy-500 focus:ring-2 focus:ring-justefy-200 outline-none transition-all resize-none text-sm sm:text-base"
                />
                {errors.message && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 sm:py-4 bg-justefy-500 text-white rounded-xl font-semibold text-base sm:text-lg hover:bg-justefy-600 transition-all duration-300 hover:shadow-xl hover:shadow-justefy-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    إرسال الطلب
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}