'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HtmlDirectionProvider() {
  const { language } = useLanguage();
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    const isEventRoute = pathname?.startsWith('/events/');
    const isMarriagePass = pathname?.startsWith('/marriage-pass');

    if (isMarriagePass || (isEventRoute && language === 'ar')) {
      html.dir = 'rtl';
      html.lang = 'ar-AE';
      document.body.style.direction = 'rtl';
    } else {
      html.dir = 'ltr';
      html.lang = 'en-US';
      document.body.style.direction = 'ltr';
    }
  }, [language, pathname]);

  return null;
}
