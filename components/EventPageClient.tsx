'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EventHero from './EventHero';
import RegistrationForm from './RegistrationForm';
import { EventData } from '@/lib/eventApi';

interface EventPageClientProps {
  event: EventData;
  lang: string;
}

export default function EventPageClient({ event, lang }: EventPageClientProps) {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const router = useRouter();

  const handleLanguageToggle = () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    router.push(`?lang=${newLang}`);
  };

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

  return (
    <>
      <EventHero 
        event={event} 
        lang={lang}
        onLanguageToggle={handleLanguageToggle}
        onRegisterClick={handleRegisterClick}
      />

      {/* Registration Section - Only show when button clicked */}
      {showRegistrationForm && event.registrationOpen && (
        <section id="registration" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                {lang === 'ar' ? 'سجل الآن' : 'Register for this Event'}
              </h2>
              <RegistrationForm event={event} lang={lang} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
