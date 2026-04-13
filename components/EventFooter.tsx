'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { eventPageTranslations } from '@/lib/translations';

export default function EventFooter() {
  const { language } = useLanguage();
  const copy = eventPageTranslations[language];
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8 text-start">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-lg">Future Cards</span>
          </div>
          <p dir="auto" className="text-gray-400 text-sm leading-relaxed max-w-md dynamic-content">
            {copy.footerDescription}
          </p>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p dir="auto" className="dynamic-content">&copy; {currentYear} Future Cards Events. {copy.rightsReserved}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 text-sm">
              <Link href="/" className="hover:text-blue-400 transition-colors">
                {copy.privacyPolicy}
              </Link>
              <Link href="/" className="hover:text-blue-400 transition-colors">
                {copy.termsOfService}
              </Link>
              <Link href="/" className="hover:text-blue-400 transition-colors">
                {copy.cookieSettings}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
