"use client";

import { motion } from "framer-motion";
import { 
  Megaphone,
  Search, 
  MessageCircle, 
  TrendingUp, 
  Palette, 
  Globe 
} from "lucide-react";

// مصفوفة الخدمات مدمج بها أيقونة Megaphone الجديدة
const services = [
  {
    icon: Megaphone,
    title: "إعلانات السوشيال ميديا",
    subtitle: "Meta & TikTok Ads",
    description: "حملات إعلانية مُحسّنة على فيسبوك، إنستغرام، وتيك توك تستهدف جمهورك بدقة وتُحقق أعلى معدلات التحويل.",
    features: ["استهداف دقيق", "A/B Testing", "إعادة الاستهداف"],
    color: "from-blue-500 to-purple-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: Search,
    title: "إعلانات جوجل",
    subtitle: "Google Ads - Search & Display",
    description: "ظهورك في أعلى نتائج البحث وعلى شبكة العرض لجذب العملاء في اللحظة التي يبحثون فيها عن خدماتك.",
    features: ["Search Ads", "Display Network", "YouTube Ads"],
    color: "from-red-500 to-orange-500",
    bgColor: "bg-red-50",
  },
  {
    icon: MessageCircle,
    title: "إعلانات واتساب",
    subtitle: "WhatsApp Marketing",
    description: "تواصل مباشر مع عملائك عبر واتساب بوت ذكي وحملات مراسلة مُخصصة تُحسّن معدلات الولاء.",
    features: ["واتساب بوت", "حملات Broadcast", "CRM تكامل"],
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
  },
  {
    icon: TrendingUp,
    title: "تحسين محركات البحث",
    subtitle: "SEO",
    description: "تصدر نتائج البحث العضوي مع استراتيجية SEO شاملة تضمن زيارات مستهدفة ومستدامة لموقعك.",
    features: ["تحليل الكلمات المفتاحية", "تحسين المحتوى", "بناء الروابط"],
    color: "from-amber-500 to-yellow-500",
    bgColor: "bg-amber-50",
  },
  {
    icon: Palette,
    title: "تعزيز الهوية البصرية",
    subtitle: "Branding & Visual Identity",
    description: "هوية بصرية متميزة تعكس قيم علامتك التجارية وتترك انطباعًا لا يُنسى في ذهن جمهورك.",
    features: ["تصميم الشعار", "هوية بصرية", "Brand Guidelines"],
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-50",
  },
  {
    icon: Globe,
    title: "بناء المواقع الإلكترونية",
    subtitle: "Web Development",
    description: "مواقع إلكترونية احترافية وسريعة بتصميم عصري وتجربة مستخدم سلسة تُحوّل الزوار إلى عملاء.",
    features: ["Next.js / React", "تصميم متجاوب", "أداء عالي"],
    color: "from-justefy-400 to-justefy-600",
    bgColor: "bg-justefy-50",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function Services() {
  return (
    <section id="services" className="py-20 relative clear-both">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-justefy-100 rounded-full text-justefy-600 text-sm font-medium mb-4">
            خدماتنا المتميزة
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-justefy-900 mb-6">
            نُدير كل شيء <span className="gradient-text">في مكان واحد</span>
          </h2>
          <p className="text-base sm:text-lg text-justefy-500 max-w-2xl mx-auto px-2">
            من الإعلانات المدفوعة إلى التحسين العضوي، نقدم حلولًا متكاملة 
            تغطي كل احتياجاتك الرقمية باحترافية عالية.
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={itemVariants}
              className="group relative"
            >
              <div className="relative h-full bg-white/70 backdrop-blur-md border border-gray-100 rounded-3xl p-6 sm:p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl ${service.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-7 h-7 text-justefy-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-justefy-800 mb-1">
                  {service.title}
                </h3>
                <p className="text-sm text-justefy-400 mb-4 font-medium">
                  {service.subtitle}
                </p>
                <p className="text-justefy-600 leading-relaxed mb-6 text-sm sm:text-base">
                  {service.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {service.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 bg-justefy-50 text-justefy-600 text-xs font-medium rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}