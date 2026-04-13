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

    html.dir = 'ltr';
    html.lang = isEventRoute && language === 'ar' ? 'ar-AE' : 'en-US';
    document.body.style.direction = 'ltr';
  }, [language, pathname]);

  return null;
}
