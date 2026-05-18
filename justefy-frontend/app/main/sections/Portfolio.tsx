"use client";

import { motion } from "framer-motion";
import { ExternalLink, TrendingUp, Users, Eye } from "lucide-react";
import Image from "next/image";

const portfolioItems = [
  {
    id: 1,
    title: "حملة إطلاق منتج - TechStore",
    category: "Meta Ads",
    image: "/images/portfolio-2.png",
    stats: { reach: "2.4M", conversions: "12K", roi: "340%" },
    description:
      "حملة إطلاق منتج جديد حققت 2.4 مليون وصول و12 ألف تحويل في أسبوعين فقط.",
  },
  {
    id: 2,
    title: "موقع تجارة إلكترونية - FashionHub",
    category: "Web Development",
    image: "/images/portfolio-1.png",
    stats: { reach: "150K", conversions: "8.5K", roi: "280%" },
    description: "تصميم وتطوير متجر إلكتروني متكامل بمعدل تحويل 5.7%.",
  },
  {
    id: 3,
    title: "حملة SEO - MedicalPlus",
    category: "SEO",
    image: "/images/portfolio-3.png",
    stats: { reach: "500K", conversions: "3.2K", roi: "420%" },
    description: "تصدر نتائج البحث لـ 45 كلمة مفتاحية في 3 أشهر.",
  },
  {
    id: 4,
    title: "هوية بصرية - GreenCafe",
    category: "Branding",
    image: "/images/portfolio-4.png",
    stats: { reach: "80K", conversions: "2.1K", roi: "190%" },
    description: "تصميم هوية بصرية كاملة لسلسلة مقاهي ناشئة.",
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
            أعمالنا المُبهرة
          </span>

          <h2 className="text-4xl md:text-5xl font-bold font-display text-justefy-900 mb-6">
            نتائج تتحدث <span className="gradient-text">عن نفسها</span>
          </h2>
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

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    
                    <div className="text-center p-3 bg-justefy-50 rounded-2xl border border-justefy-100/50">
                      <Eye className="w-4 h-4 text-justefy-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-justefy-800">
                        {item.stats.reach}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-justefy-400">
                        وصول
                      </p>
                    </div>

                    <div className="text-center p-3 bg-justefy-50 rounded-2xl border border-justefy-100/50">
                      <Users className="w-4 h-4 text-justefy-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-justefy-800">
                        {item.stats.conversions}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-justefy-400">
                        تحويل
                      </p>
                    </div>

                    <div className="text-center p-3 bg-justefy-50 rounded-2xl border border-justefy-100/50">
                      <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-green-600">
                        {item.stats.roi}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-justefy-400">
                        عائد
                      </p>
                    </div>
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