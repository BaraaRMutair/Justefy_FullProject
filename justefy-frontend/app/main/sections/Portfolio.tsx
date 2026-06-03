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
    description:
      "إدارة حملة إعلانية متكاملة على منصات Meta بهدف زيادة الوعي بالعلامة التجارية.",
    services: ["إدارة الإعلانات", "استهداف الجمهور", "تحسين الأداء"],
  },
  {
    id: 2,
    title: "متجر إلكتروني للملابس",
    category: "Web Development",
    image: "/images/portfolio-1.png",
    description:
      "تصميم وتطوير متجر إلكتروني متكامل مع تجربة استخدام سلسة ومتوافقة مع جميع الأجهزة.",
    services: ["تصميم UI/UX", "تطوير المتجر", "تحسين السرعة"],
  },
  {
    id: 3,
    title: "تحسين ظهور موقع طبي",
    category: "SEO",
    image: "/images/portfolio-3.png",
    description:
      "تنفيذ استراتيجية SEO لتحسين ظهور الموقع في نتائج البحث العضوية.",
    services: ["SEO تقني", "تحسين المحتوى", "الكلمات المفتاحية"],
  },
  {
    id: 4,
    title: "هوية بصرية لشركة",
    category: "Branding",
    image: "/images/portfolio-4.png",
    description:
      "تطوير هوية بصرية متكاملة تعكس شخصية العلامة التجارية.",
    services: ["تصميم الشعار", "دليل الهوية", "المطبوعات"],
  },
];

export default function Portfolio() {
  return (
    <section id="portfolio" className="section-padding bg-white/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-justefy-100 rounded-full text-justefy-600 text-sm font-medium mb-4">
  نماذج من أعمالنا
</span>

<h2 className="text-4xl md:text-5xl font-bold font-display text-justefy-900 mb-4">
  مشاريع نفخر <span className="gradient-text">بتنفيذها</span>
</h2>

<p className="max-w-2xl mx-auto text-justefy-500 text-lg leading-relaxed">
  مجموعة من المشاريع التي عملنا عليها في مجالات التسويق الرقمي وتطوير المواقع
  وبناء الهويات البصرية.
</p>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-10">
          {portfolioItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500">

                {/* Image */}
                <div className="relative h-72 overflow-hidden">
                  
                  {/* Overlay */}
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
                  <div className="absolute top-4 right-4 z-20 px-4 py-2 bg-white/95 backdrop-blur rounded-full text-xs font-bold text-justefy-700 shadow-sm">
                    {item.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-justefy-800 mb-3 group-hover:text-justefy-500 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-justefy-500 mb-6 text-sm leading-relaxed">
                    {item.description}
                  </p>

               
              <div className="flex flex-wrap gap-2 mb-8">
                {item.services.map((service) => (
                     <span
                             key={service}
                               className="px-3 py-2 bg-justefy-50 border border-justefy-100 rounded-full text-xs font-medium text-justefy-600"
                                          >
                                        {service}
    
  </span>
  ))}
</div>

                  {/* Button */}
                  <button className="w-full py-4 bg-justefy-50 text-justefy-600 rounded-2xl font-bold hover:bg-justefy-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                    عرض التفاصيل
                    <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
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