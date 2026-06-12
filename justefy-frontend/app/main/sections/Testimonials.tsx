"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "أحمد الخالدي",
    role: "CEO - TechStore",
    content: "تعاملت مع العديد من الوكالات، لكن Justefy كانت مختلفة تمامًا. النتائج كانت مذهلة وفوق التوقعات. حملتنا حققت 340% عائد على الاستثمار!",
    rating: 5,
    avatar: "أ",
  },
  {
    id: 2,
    name: "كريم الشنطي",
    role: "Founder - FashionHub",
    content: "فريق احترافي يفهم احتياجات السوق. الموقع الجديد زاد مبيعاتنا بنسبة 180% في الشهر الأول. أنصح بالتعامل معهم بشدة.",
    rating: 5,
    avatar: "ك",
  },
  {
    id: 3,
    name: "محمد زقوت",
    role: "Marketing Director - MedicalPlus",
    content: "استراتيجية SEO التي وضعوها لنا جعلتنا نتصدر نتائج البحث في وقت قياسي. دعم ممتاز وتقارير شفافة.",
    rating: 5,
    avatar: "م",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-20 sm:scroll-mt-24 py-12 sm:py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14 md:mb-20"
        >
          <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-justefy-100 rounded-full text-justefy-600 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            آراء عملائنا
          </span>
<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-normal tracking-wide font-display text-justefy-900 mb-4 sm:mb-6">
    ثقة تُبنى{" "}
    <span 
        className="text-transparent bg-clip-text bg-gradient-to-l from-justefy-500 to-justefy-700 inline-block"
        style={{ paddingBottom: '0.2em', marginBottom: '-0.2em' }}
    >
        بنتائج حقيقية
    </span>
</h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative mt-3 sm:mt-4"
            >
              <div className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 h-full flex flex-col bg-white/80 border border-white/20 shadow-md">
                {/* Quote Icon - Responsive positioning */}
                <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-10 h-10 sm:w-12 sm:h-12 bg-justefy-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg z-10">
                  <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-white transform scale-x-[-1]" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4 sm:mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-justefy-700 leading-relaxed mb-6 sm:mb-8 flex-grow text-sm sm:text-base lg:text-lg">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-justefy-100">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-justefy-400 to-justefy-600 flex items-center justify-center text-white font-bold text-base sm:text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-justefy-800 text-sm sm:text-base">{testimonial.name}</h4>
                    <p className="text-xs sm:text-sm text-justefy-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}