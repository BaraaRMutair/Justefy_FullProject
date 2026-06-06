"use client";
import Link from "next/link";
import { Zap, ArrowUp } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-justefy-900 text-white py-10 sm:py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-10 sm:mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-justefy-400 to-justefy-600 flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold font-display">Justefy</span>
            </div>
            <p className="text-justefy-300 leading-relaxed max-w-md text-sm sm:text-base">
              شريكك الموثوق في عالم التسويق الرقمي. نُحوّل رؤيتك إلى نتائج ملموسة 
              من خلال استراتيجيات مبتكرة وتنفيذ احترافي.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">روابط سريعة</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li>
                <Link href="#services" className="text-justefy-300 hover:text-white transition-colors text-sm sm:text-base">
                  خدماتنا
                </Link>
              </li>
              <li>
                <Link href="#portfolio" className="text-justefy-300 hover:text-white transition-colors text-sm sm:text-base">
                  أعمالنا
                </Link>
              </li>
              <li>
                <Link href="#testimonials" className="text-justefy-300 hover:text-white transition-colors text-sm sm:text-base">
                  آراء العملاء
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-justefy-300 hover:text-white transition-colors text-sm sm:text-base">
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">تواصل معنا</h4>
            <ul className="space-y-2.5 sm:space-y-3 text-justefy-300 text-sm sm:text-base">
              <li>+970598985831</li>
              <li>hello@justefy.com</li>
              <li>فلسطين - غزة</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-justefy-800 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-justefy-400 text-xs sm:text-sm text-center sm:text-right">
            2026 Justefy. جميع الحقوق محفوظة.
          </p>
          <button
            onClick={scrollToTop}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-justefy-800 hover:bg-justefy-700 flex items-center justify-center transition-colors"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </footer>
  );
}