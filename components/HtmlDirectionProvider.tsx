'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HtmlDirectionProvider() {
  const { language } = useLanguage();
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    const isOrganizerRoute = pathname?.startsWith('/organizer');
    const isArabic = !isOrganizerRoute && language === 'ar';
    const direction = isArabic ? 'rtl' : 'ltr';

    html.dir = direction;
    html.lang = isArabic ? 'ar-AE' : 'en-US';
    document.body.style.direction = direction;
  }, [language, pathname]);

  return null;
}
