"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

const portfolioItems = [
  {
    id: 1,
    title: "حملة إعلانية لمتجر إلكترونيات",
    category: "Meta Ads",
    image: "/images/portfolio-2.png",
    description: "إدارة حملة إعلانية متكاملة على منصات Meta بهدف زيادة الوعي بالعلامة التجارية.",
    services: ["إدارة الإعلانات", "استهداف الجمهور", "تحسين الأداء"],
  },
  {
    id: 2,
    title: "متجر إلكتروني للملابس",
    category: "Web Development",
    image: "/images/portfolio-1.png",
    description: "تصميم وتطوير متجر إلكتروني متكامل مع تجربة استخدام سلسة ومتوافقة مع جميع الأجهزة.",
    services: ["تصميم UI/UX", "تطوير المتجر", "تحسين السرعة"],
  },
  {
    id: 3,
    title: "تحسين ظهور موقع طبي",
    category: "SEO",
    image: "/images/portfolio-3.png",
    description: "تنفيذ استراتيجية SEO لتحسين ظهور الموقع في نتائج البحث العضوية.",
    services: ["SEO تقني", "تحسين المحتوى", "الكلمات المفتاحية"],
  },
  {
    id: 4,
    title: "هوية بصرية لشركة",
    category: "Branding",
    image: "/images/portfolio-4.png",
    description: "تطوير هوية بصرية متكاملة تعكس شخصية العلامة التجارية.",
    services: ["تصميم الشعار", "دليل الهوية", "المطبوعات"],
  },
];

export default function Portfolio() {
  return (
    <section id="portfolio" className="scroll-mt-20 sm:scroll-mt-24 py-12 sm:py-16 md:py-20 bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-justefy-100 rounded-full text-justefy-600 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            نماذج من أعمالنا
          </span>
<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-normal tracking-wide font-display text-justefy-900 mb-3 sm:mb-4">
    مشاريع نفخر <span className="gradient-text">بتنفيذها</span>
</h2>
          <p className="max-w-2xl mx-auto text-justefy-500 text-sm sm:text-base lg:text-lg leading-relaxed px-2">
            مجموعة من المشاريع التي عملنا عليها في مجالات التسويق الرقمي وتطوير المواقع وبناء الهويات البصرية.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
          {portfolioItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500">
                {/* Image */}
<div className="relative h-52 sm:h-60 md:h-64 lg:h-72 overflow-hidden">
                    <div className="absolute inset-0 bg-justefy-900/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={item.id === 1}
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Category badge */}
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/95 backdrop-blur rounded-full text-xs font-bold text-justefy-700 shadow-sm">
                    {item.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 md:p-8">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-justefy-800 mb-2 sm:mb-3 group-hover:text-justefy-500 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-justefy-500 mb-4 sm:mb-6 text-xs sm:text-sm leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5 sm:mb-8">
                    {item.services.map((service) => (
                      <span
                        key={service}
                        className="px-2.5 py-1 sm:px-3 sm:py-2 bg-justefy-50 border border-justefy-100 rounded-full text-xs font-medium text-justefy-600"
                      >
                        {service}
                      </span>
                    ))}
                  </div>

                  {/* Button */}
                  <button className="w-full py-3 sm:py-4 bg-justefy-50 text-justefy-600 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:bg-justefy-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                    عرض التفاصيل
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:-translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}