'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EventHero from './EventHero';
import RegistrationForm from './RegistrationForm';
import { EventData } from '@/lib/eventApi';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';

interface EventPageClientProps {
  event: EventData;
}

export default function EventPageClient({ event }: EventPageClientProps) {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const { language, t } = useLanguage();

  const hasArabicContent = event.languages?.includes('ar') || false;

  const handleRegisterClick = () => {
    setShowRegistrationForm(true);
    // Smooth scroll to registration form
    setTimeout(() => {
      document.getElementById('registration')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  // Get localized content
  const getLocalizedContent = (enContent: string | undefined, arContent: string | undefined) => {
    if (language === 'ar' && arContent) return arContent;
    return enContent || '';
  };

  return (
    <>
      {/* Language Toggle */}
      <LanguageToggle hasArabicContent={hasArabicContent} />

      {/* Organizer Login Button */}
      <Link 
        href="/organizer/login"
        className="fixed top-6 left-6 z-50 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center gap-2 shadow-lg group"
      >
        <svg 
          className="w-5 h-5 group-hover:scale-110 transition-transform" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        </svg>
        <span className="text-sm font-medium">
          {language === 'ar' ? 'دخول المنظم' : 'Organizer Login'}
        </span>
      </Link>

      <EventHero 
        event={event}
        onRegisterClick={handleRegisterClick}
      />

      {/* Registration Section - Only show when button clicked */}
      {showRegistrationForm && event.registrationOpen && (
        <section id="registration" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                {t('registerForEvent')}
              </h2>
              <RegistrationForm event={event} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
