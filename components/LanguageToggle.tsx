"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";

interface LanguageToggleProps {
  showWhenArabicAvailable?: boolean;
  hasArabicContent?: boolean;
}

export default function LanguageToggle({ 
  showWhenArabicAvailable = true, 
  hasArabicContent = false 
}: LanguageToggleProps) {
  const { language, toggleLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted (avoids hydration mismatch)
  if (!mounted) return null;

  // Hide if no Arabic content and showWhenArabicAvailable is true
  if (showWhenArabicAvailable && !hasArabicContent) {
    return null;
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 bg-white shadow-lg rounded-full hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-indigo-500"
      aria-label="Toggle Language"
    >
      <span className="text-xl">🌐</span>
      <span className="font-medium text-gray-700">
        {language === 'en' ? 'العربية' : 'English'}
      </span>
    </button>
  );
}
