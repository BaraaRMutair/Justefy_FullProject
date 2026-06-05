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
    <section id="testimonials" className="section-padding">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-2 bg-justefy-100 rounded-full text-justefy-600 text-sm font-medium mb-4">
            آراء عملائنا
          </span>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-justefy-900 mb-6">
            ثقة تُبنى <span className="gradient-text">بنتائج حقيقية</span>
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative mt-4" /* أضفت هُنا هامش بسيط علوي بسبب خروج الأيقونة */
            >
              <div className="glass-card rounded-3xl p-8 h-full flex flex-col bg-white/80 border border-white/20 shadow-md">
                {/* Quote Icon - تم نقلها لليسار لتناسب العربي */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-justefy-500 rounded-2xl flex items-center justify-center shadow-lg z-10">
                  <Quote className="w-6 h-6 text-white transform scale-x-[-1]" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-justefy-700 leading-relaxed mb-8 flex-grow text-lg">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-justefy-100">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-justefy-400 to-justefy-600 flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-justefy-800">{testimonial.name}</h4>
                    <p className="text-sm text-justefy-400">{testimonial.role}</p>
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