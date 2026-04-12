'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function EventFooter() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-20">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Brand Section */}
        <div className="mb-8 text-start">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-lg">Future Cards</span>
          </div>
          <p dir="auto" className="text-gray-400 text-sm leading-relaxed max-w-md dynamic-content">
            {isArabic 
              ? 'اكتشف وسجل وجرب الأحداث المذهلة مع التذاكر الرقمية والدخول السلس.'
              : 'Discover, register, and experience amazing events with digital passes and seamless check-ins.'}
          </p>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p dir="auto" className="dynamic-content">&copy; {currentYear} Future Cards Events. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 text-sm">
              <Link href="/" className="hover:text-blue-400 transition-colors">
                {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </Link>
              <Link href="/" className="hover:text-blue-400 transition-colors">
                {isArabic ? 'شروط الخدمة' : 'Terms of Service'}
              </Link>
              <Link href="/" className="hover:text-blue-400 transition-colors">
                {isArabic ? 'إعدادات الملفات' : 'Cookie Settings'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
