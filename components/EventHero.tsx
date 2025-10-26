'use client';

import Image from 'next/image';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import { EventData } from '@/lib/eventApi';
import { formatDateRange, formatTime } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface EventHeroProps {
  event: EventData;
  onRegisterClick: () => void;
  hideRegisterButton?: boolean;
}

export default function EventHero({ event, onRegisterClick, hideRegisterButton = false }: EventHeroProps) {
  const { language, t } = useLanguage();
  
  // Use backgroundImageUrl (from API) or fallback to bannerImageUrl for backward compatibility
  const backgroundImage = event.backgroundImageUrl || event.bannerImageUrl;
  
  // Use the event's useBackgroundAsHero setting to determine background mode (configuration-based, no user toggle)
  const showImageBackground = event.useBackgroundAsHero && backgroundImage;
  
  const isArabic = language === 'ar';
  
  const title = isArabic && event.arabicTitle ? event.arabicTitle : event.title;
  const shortDesc = isArabic && event.arabicShortDescription 
    ? event.arabicShortDescription 
    : event.shortDescription;
  const venue = isArabic && event.arabicVenue ? event.arabicVenue : event.venue;
  const location = isArabic && event.arabicLocation ? event.arabicLocation : event.location;

  const dateRange = formatDateRange(event.startDate, event.endDate, isArabic ? 'ar-AE' : 'en-US');
  const startTimeFormatted = formatTime(event.startTime, isArabic ? 'ar-AE' : 'en-US');
  const endTimeFormatted = formatTime(event.endTime, isArabic ? 'ar-AE' : 'en-US');

  const remainingCapacity = event.capacity - event.totalRegistrations;
  const capacityPercentage = (event.totalRegistrations / event.capacity) * 100;

  return (
    <section className="relative w-full min-h-screen overflow-hidden">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Background */}
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ${
            showImageBackground ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ 
            background: `linear-gradient(135deg, ${event.primaryColor || '#1e3a8a'} 0%, ${event.secondaryColor || '#3b82f6'} 100%)` 
          }}
        />
        
        {/* Image Background */}
        {backgroundImage && (
          <div 
            className={`absolute inset-0 transition-opacity duration-1000 ${
              showImageBackground ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={backgroundImage}
              alt={title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
          </div>
        )}

        {/* Subtle Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30" />

        {/* Floating Particles */}
        <div className="absolute w-2 h-2 bg-white/20 rounded-full animate-float-1" style={{top: '20%', left: '10%'}} />
        <div className="absolute w-3 h-3 bg-white/15 rounded-full animate-float-2" style={{top: '60%', left: '20%'}} />
        <div className="absolute w-2 h-2 bg-white/25 rounded-full animate-float-3" style={{top: '40%', right: '15%'}} />
        <div className="absolute w-3 h-3 bg-white/10 rounded-full animate-float-1" style={{top: '70%', right: '25%'}} />
        <div className="absolute w-2 h-2 bg-white/20 rounded-full animate-float-2" style={{top: '30%', left: '70%'}} />

        {/* Enhanced Gradient Orbs with Blob Animation */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
        <div className="absolute top-40 -right-20 w-72 h-72 bg-gradient-to-l from-yellow-500 to-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-20 w-72 h-72 bg-gradient-to-t from-green-500 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
        <div className="absolute bottom-40 right-40 w-72 h-72 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-6000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-8000" />
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            {/* Event Logo */}
            {event.logoUrl && (
              <div className="mb-6 animate-float-1">
                <Image
                  src={event.logoUrl}
                  alt="Event Logo"
                  width={120}
                  height={120}
                  className="rounded-lg bg-white/10 backdrop-blur-sm p-2 shadow-2xl"
                />
              </div>
            )}

            {/* Title with enhanced animation */}
            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl leading-tight animate-fade-in-up ${isArabic ? 'text-right font-arabic' : ''}`}>
              {title}
            </h1>

            {/* Short Description with better contrast */}
            {shortDesc && (
              <p className={`text-xl sm:text-2xl text-white/95 mb-10 max-w-2xl drop-shadow-lg leading-relaxed ${isArabic ? 'text-right' : ''}`}>
                {shortDesc}
              </p>
            )}

            {/* Premium Event Details Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {/* Date Card */}
              <div className="group relative bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-full min-h-[120px] flex items-center">
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0 w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center group-hover:bg-white/25 transition-colors">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/70 text-[10px] uppercase tracking-[0.15em] mb-1.5 font-semibold">
                      {isArabic ? 'التاريخ' : 'Date'}
                    </div>
                    <div className="text-white font-bold text-sm leading-tight">
                      {dateRange}
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Card */}
              {(event.startTime || event.endTime) && (
                <div className="group relative bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-full min-h-[120px] flex items-center">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0 w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center group-hover:bg-white/25 transition-colors">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/70 text-[10px] uppercase tracking-[0.15em] mb-1.5 font-semibold">
                        {isArabic ? 'الوقت' : 'Time'}
                      </div>
                      <div className="text-white font-bold text-sm leading-tight">
                        {startTimeFormatted}
                        {endTimeFormatted && <><br className="leading-tight"/>{endTimeFormatted}</>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Card */}
              {(venue || location) && (
                <div className="group relative bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-full min-h-[120px] flex items-center">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0 w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center group-hover:bg-white/25 transition-colors">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/70 text-[10px] uppercase tracking-[0.15em] mb-1.5 font-semibold">
                        {t('location')}
                      </div>
                      <div className="text-white font-bold text-sm leading-tight line-clamp-2">
                        {venue || location}
                      </div>
                      {event.city && (
                        <div className="text-white/70 text-[10px] mt-1 truncate">
                          {event.city}, {event.country}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Capacity Card */}
              <div className="group relative bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-full min-h-[120px] flex items-center">
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0 w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center group-hover:bg-white/25 transition-colors">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/70 text-[10px] uppercase tracking-[0.15em] mb-1.5 font-semibold">
                      {isArabic ? 'المقاعد' : 'Seats'}
                    </div>
                    <div className="text-white font-bold text-xl leading-tight mb-2">
                      {remainingCapacity}<span className="text-xs text-white/70 font-normal">/{event.capacity}</span>
                    </div>
                    {/* Modern Progress Bar */}
                    <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-700 ${
                          capacityPercentage > 80 ? 'bg-gradient-to-r from-red-400 to-red-500' :
                          capacityPercentage > 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                          'bg-gradient-to-r from-green-400 to-emerald-500'
                        }`}
                        style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced CTA Section - Price & Register Button */}
            {!hideRegisterButton && (
              <div className="flex flex-wrap items-center gap-6">
                {!event.isFree && (
                  <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-lg rounded-2xl px-8 py-5 border-2 border-white/30 shadow-xl hover:bg-white/25 transition-all duration-300">
                    <span className="text-white/90 text-sm font-semibold uppercase tracking-wider">
                      {isArabic ? 'السعر' : 'Price'}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-white text-4xl font-bold tracking-tight">
                        {event.earlyBirdPrice || event.regularPrice}
                      </span>
                      <span className="text-white/80 text-lg font-semibold">
                        {event.currency}
                      </span>
                    </div>
                  </div>
                )}

                {event.registrationOpen && (
                  <button
                    onClick={onRegisterClick}
                    className="group relative px-12 py-5 bg-gradient-to-r from-white to-gray-50 text-blue-900 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-300 overflow-hidden border-2 border-white/50"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {t('register')}
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </button>
                )}
              </div>
            )}

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl">
              <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl font-bold text-white mb-2">
                  12
                </div>
                <div className="text-white/80 text-sm font-medium">
                  {isArabic ? 'متحدثون' : 'Speakers'}
                </div>
              </div>
              
              <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl font-bold text-white mb-2">
                  {event.agenda?.length || 8}
                </div>
                <div className="text-white/80 text-sm font-medium">
                  {isArabic ? 'جلسات' : 'Sessions'}
                </div>
              </div>
              
              <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="text-4xl font-bold text-white mb-2">
                  {event.totalRegistrations}
                </div>
                <div className="text-white/80 text-sm font-medium">
                  {isArabic ? 'مسجلون' : 'Registered'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
