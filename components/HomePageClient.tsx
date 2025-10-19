'use client';

import { useState } from 'react';
import { Calendar, MapPin, Users, ArrowRight, Globe } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface HomePageClientProps {
  events: any[];
}

export default function HomePageClient({ events }: HomePageClientProps) {
  const [lang, setLang] = useState('en');
  const isArabic = lang === 'ar';

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
  };

  const content = {
    en: {
      title1: "Discover Amazing",
      title2: "Events & Experiences",
      subtitle: "Join industry leaders, innovators, and visionaries at our upcoming events. Register now to secure your spot!",
      noEvents: "No Events Yet",
      noEventsDesc: "Check back soon for upcoming events!",
      viewDetails: "View Details",
      openReg: "Open for Registration",
      closedReg: "Registration Closed",
      freeEvent: "Free Event",
      from: "From",
      registered: "registered",
    },
    ar: {
      title1: "اكتشف فعاليات",
      title2: "مذهلة وتجارب فريدة",
      subtitle: "انضم إلى قادة الصناعة والمبتكرين والمفكرين في فعالياتنا القادمة. سجل الآن لحجز مكانك!",
      noEvents: "لا توجد فعاليات حتى الآن",
      noEventsDesc: "تحقق مرة أخرى قريبًا للفعاليات القادمة!",
      viewDetails: "عرض التفاصيل",
      openReg: "التسجيل مفتوح",
      closedReg: "التسجيل مغلق",
      freeEvent: "فعالية مجانية",
      from: "من",
      registered: "مسجل",
    }
  };

  const t = content[lang as keyof typeof content];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob top-0 left-0"></div>
        <div className="absolute w-96 h-96 bg-gradient-to-l from-blue-500 to-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 top-0 right-0"></div>
        <div className="absolute w-96 h-96 bg-gradient-to-t from-indigo-500 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000 bottom-0 left-1/2"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 py-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl flex items-center justify-center shadow-2xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Future Cards Events</span>
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 group"
              title={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              <Globe className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              <span className="text-white text-sm font-semibold">{isArabic ? 'EN' : 'AR'}</span>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className={`px-6 py-16 text-center ${isArabic ? 'rtl' : 'ltr'}`}>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              {t.title1}
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                {t.title2}
              </span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </div>
        </section>

        {/* Events Grid */}
        <section className="px-6 pb-20">
          <div className="max-w-7xl mx-auto">
            {events.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-white/60" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">{t.noEvents}</h3>
                <p className="text-white/70 mb-8">{t.noEventsDesc}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.landingPageSlug}?lang=${lang}`}
                    className="group"
                  >
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                      {/* Event Image */}
                      {event.bannerImageUrl && (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={event.bannerImageUrl}
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          
                          {/* Status Badge */}
                          {event.registrationOpen ? (
                            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              {t.openReg}
                            </div>
                          ) : (
                            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              {t.closedReg}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Event Details */}
                      <div className="p-6">
                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                          {event.title}
                        </h3>
                        
                        {event.shortDescription && (
                          <p className="text-white/70 mb-4 line-clamp-2">
                            {event.shortDescription}
                          </p>
                        )}

                        <div className="space-y-2 mb-4">
                          {/* Date */}
                          <div className="flex items-center text-white/80 text-sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>
                              {new Date(event.startDate).toLocaleDateString(isArabic ? 'ar-AE' : 'en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>

                          {/* Location */}
                          {event.venue && (
                            <div className="flex items-center text-white/80 text-sm">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{event.venue}, {event.city}</span>
                            </div>
                          )}

                          {/* Capacity */}
                          <div className="flex items-center text-white/80 text-sm">
                            <Users className="w-4 h-4 mr-2" />
                            <span>
                              {event.totalRegistrations} / {event.capacity} {t.registered}
                            </span>
                          </div>
                        </div>

                        {/* Price Tag */}
                        {event.isFree ? (
                          <div className="inline-flex items-center bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                            {t.freeEvent}
                          </div>
                        ) : (
                          <div className="inline-flex items-center bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                            {t.from} {event.currency} {event.regularPrice}
                          </div>
                        )}

                        {/* CTA Button */}
                        <div className="flex items-center text-purple-300 font-semibold group-hover:text-white transition-colors">
                          <span>{t.viewDetails}</span>
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto text-center text-white/60 text-sm">
            © 2025 Future Cards Events. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
