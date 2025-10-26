'use client';

import Image from 'next/image';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import { EventData } from '@/lib/eventApi';
import { formatDateRange, formatTime } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface EventHeroProps {
  event: EventData;
  onRegisterClick: () => void;
}

export default function EventHero({ event, onRegisterClick }: EventHeroProps) {
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

        {/* Particle Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-20" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

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

            {/* Title */}
            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg leading-tight ${isArabic ? 'text-right font-arabic' : ''}`}>
              {title}
            </h1>

            {/* Short Description */}
            {shortDesc && (
              <p className={`text-2xl text-white/90 mb-10 max-w-2xl drop-shadow-md ${isArabic ? 'text-right' : ''}`}>
                {shortDesc}
              </p>
            )}

            {/* Event Details Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Date */}
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <Calendar className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-white/70 text-sm mb-1">
                    {isArabic ? 'التاريخ' : 'Date'}
                  </div>
                  <div className="text-white font-semibold text-sm">
                    {dateRange}
                  </div>
                </div>
              </div>

              {/* Time */}
              {(event.startTime || event.endTime) && (
                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Clock className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-white/70 text-sm mb-1">
                      {isArabic ? 'الوقت' : 'Time'}
                    </div>
                    <div className="text-white font-semibold text-sm">
                      {startTimeFormatted}
                      {endTimeFormatted && ` - ${endTimeFormatted}`}
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              {(venue || location) && (
                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <MapPin className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-white/70 text-sm mb-1">
                      {t('location')}
                    </div>
                    <div className="text-white font-semibold text-sm">
                      {venue || location}
                    </div>
                    {event.city && (
                      <div className="text-white/80 text-xs mt-1">
                        {event.city}, {event.country}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Capacity */}
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <Users className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                <div className="w-full">
                  <div className="text-white/70 text-sm mb-1">
                    {isArabic ? 'السعة المتبقية' : 'Seats Available'}
                  </div>
                  <div className="text-white font-semibold text-sm mb-2">
                    {remainingCapacity} / {event.capacity}
                  </div>
                  {/* Capacity Bar */}
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-300"
                      style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Price & Register Button */}
            <div className="flex flex-wrap items-center gap-6 mb-12">
              {!event.isFree && (
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-6 py-3 border border-white/30">
                  <span className="text-white/80 text-sm">
                    {isArabic ? 'السعر من' : 'Starting from'}
                  </span>
                  <span className="text-white text-2xl font-bold">
                    {event.earlyBirdPrice || event.regularPrice} {event.currency}
                  </span>
                </div>
              )}
              
              {event.isFree && (
                <div className="inline-flex items-center bg-green-500/30 backdrop-blur-md rounded-full px-6 py-3 border border-green-400/50">
                  <span className="text-white text-lg font-bold">
                    {t('free')}
                  </span>
                </div>
              )}

              {event.registrationOpen && (
                <button
                  onClick={onRegisterClick}
                  className="px-8 py-4 bg-white text-blue-900 rounded-full font-bold text-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-xl"
                >
                  {t('register')}
                </button>
              )}
            </div>

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
