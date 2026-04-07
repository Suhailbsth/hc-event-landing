'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HtmlDirectionProvider() {
  const { language } = useLanguage();

  useEffect(() => {
    const html = document.documentElement;
    const isArabic = language === 'ar';
    
    // Set direction
    html.dir = isArabic ? 'rtl' : 'ltr';
    html.lang = isArabic ? 'ar-AE' : 'en-US';
    
    // Update body style
    document.body.style.direction = isArabic ? 'rtl' : 'ltr';
  }, [language]);

  return null;
}
