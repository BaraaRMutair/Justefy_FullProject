"use client";
import Link from "next/link";
import { Zap, ArrowUp } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-justefy-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-justefy-400 to-justefy-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold font-display">Justefy</span>
            </div>
            <p className="text-justefy-300 leading-relaxed max-w-md">
              شريكك الموثوق في عالم التسويق الرقمي. نُحوّل رؤيتك إلى نتائج ملموسة 
              من خلال استراتيجيات مبتكرة وتنفيذ احترافي.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">روابط سريعة</h4>
            <ul className="space-y-3">
              <li>
                <Link href="#services" className="text-justefy-300 hover:text-white transition-colors">
                  خدماتنا
                </Link>
              </li>
              <li>
                <Link href="#portfolio" className="text-justefy-300 hover:text-white transition-colors">
                  أعمالنا
                </Link>
              </li>
              <li>
                <Link href="#testimonials" className="text-justefy-300 hover:text-white transition-colors">
                  آراء العملاء
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-justefy-300 hover:text-white transition-colors">
                تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4">تواصل معنا </h4>
            <ul className="space-y-3 text-justefy-300">
              <li>+970598985831</li>
              <li>hello@justefy.com</li>
              <li>فلسطين -غزة</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-justefy-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-justefy-400 text-sm">
             2026 Justefy. جميع الحقوق محفوظة.
          </p>
          <button
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-justefy-800 hover:bg-justefy-700 flex items-center justify-center transition-colors"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </footer>
  );
}