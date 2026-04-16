'use client';

import { useState } from 'react';
import Link from 'next/link';
import EventHero from './EventHero';
import EventMap from './EventMap';
import EventFooter from './EventFooter';
import RegistrationForm from './RegistrationForm';
import { EventData } from '@/lib/eventApi';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { eventPageTranslations } from '@/lib/translations';

interface EventPageClientProps {
  event: EventData;
}

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim()) || '';
}

export default function EventPageClient({ event }: EventPageClientProps) {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const { language, t } = useLanguage();
  const copy = eventPageTranslations[language];
  const isArabic = language === 'ar';

  const hasArabicContent = event.languages?.includes('ar') || false;

  const handleRegisterClick = () => {
    setShowRegistrationForm(true);
    setTimeout(() => {
      document.getElementById('registration')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const getLocalizedContent = (enContent: string | undefined, arContent: string | undefined) => {
    if (isArabic && arContent?.trim()) return arContent;
    return enContent || '';
  };

  const aboutContent =
    getLocalizedContent(event.description, event.arabicDescription) ||
    getLocalizedContent(event.shortDescription, event.arabicShortDescription) ||
    '';

  const mapTitle = isArabic
    ? firstNonEmpty(event.arabicLocation, event.venue, event.location, event.arabicVenue)
    : firstNonEmpty(event.venue, event.location, event.arabicLocation, event.arabicVenue);

  const mapSubtitle = (isArabic
    ? [event.location, event.arabicVenue, event.venue, event.arabicLocation]
    : [event.location, event.arabicVenue, event.venue]
  ).find((value) => value?.trim() && value !== mapTitle);

  return (
    <>
      <div className="fixed top-0 start-0 end-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-md transition-all duration-300">
        <Link
          href={`/organizer/login?returnTo=${event.id}&eventTitle=${encodeURIComponent(event.title)}`}
          className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white/20 backdrop-blur-lg text-white rounded-xl border border-white/40 hover:bg-white/30 hover:border-white/60 transition-all duration-300 flex items-center gap-2 shadow-lg group font-semibold"
          title={copy.organizerLogin}
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
          <span className="text-xs sm:text-sm font-bold hidden sm:inline">{copy.organizerLogin}</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {event.registrationOpen && (
            <button
              onClick={handleRegisterClick}
              className="px-4 sm:px-7 py-2 sm:py-2.5 bg-gradient-to-r from-white via-gray-50 to-white text-blue-900 rounded-full font-bold text-xs sm:text-sm shadow-2xl hover:shadow-3xl hover:scale-105 sm:hover:scale-110 transition-all duration-300 border border-white/80 flex items-center gap-2"
            >
              <span className="hidden xs:inline">{t('register')}</span>
              <span className="xs:hidden">{t('Join')}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}

          <LanguageToggle hasArabicContent={hasArabicContent} />
        </div>
      </div>

      <EventHero event={event} onRegisterClick={handleRegisterClick} hideRegisterButton />

      <section className="w-full py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 dir="auto" className="text-4xl font-bold text-gray-900 mb-6 dynamic-content">
              {copy.aboutEvent}
            </h2>
            <div
              dir="auto"
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed bg-white p-8 rounded-lg shadow-sm border border-gray-100 dynamic-content"
              dangerouslySetInnerHTML={{ __html: aboutContent }}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {event.highlights && event.highlights.length > 0 && (
              <div>
                <h3 dir="auto" className="text-2xl font-bold text-gray-900 mb-6 dynamic-content">
                  {copy.eventHighlights}
                </h3>
                <div className="space-y-3">
                  {event.highlights.map((highlight: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-300 transition-colors text-start"
                    >
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-green-100 rounded-full text-green-600 font-bold text-sm">
                        ✓
                      </span>
                      <span dir="auto" className="text-gray-700 dynamic-content">
                        {highlight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.agenda && event.agenda.length > 0 && (
              <div>
                <h3 dir="auto" className="text-2xl font-bold text-gray-900 mb-6 dynamic-content">
                  {copy.agenda}
                </h3>
                <div className="space-y-4">
                  {event.agenda.map((item, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border-s-4 border-blue-500 text-start"
                    >
                      <div dir="auto" className="text-sm font-semibold text-blue-600 mb-2 dynamic-content">
                        {item.time}
                      </div>
                      <div dir="auto" className="text-gray-900 font-semibold mb-2 dynamic-content">
                        {item.title}
                      </div>
                      {item.description && (
                        <div dir="auto" className="text-sm text-gray-600 dynamic-content">
                          {item.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {showRegistrationForm && event.registrationOpen && (
        <section id="registration" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <h2 dir="auto" className="text-3xl font-bold text-gray-900 mb-8 text-start dynamic-content">
                {t('registerForEvent')}
              </h2>
              <RegistrationForm event={event} />
            </div>
          </div>
        </section>
      )}

      {(event.latitude || event.longitude) && (
        <section className="w-full bg-white py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 dir="auto" className="text-4xl font-bold text-gray-900 mb-12 text-start dynamic-content">
              {copy.venueLocation}
            </h2>
            <EventMap latitude={event.latitude} longitude={event.longitude} title={mapTitle} subtitle={mapSubtitle} />
          </div>
        </section>
      )}

      <section className="w-full">
        <EventFooter />
      </section>
    </>
  );
}
