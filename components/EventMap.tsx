'use client';

import { MapPin, Clock, Users, ExternalLink, DollarSign, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { eventPageTranslations } from '@/lib/translations';

interface EventMapProps {
  latitude?: number;
  longitude?: number;
  title?: string;
  subtitle?: string;
}

export default function EventMap({ latitude, longitude, title, subtitle }: EventMapProps) {
  const { language } = useLanguage();
  const copy = eventPageTranslations[language];

  const mapsUrl = latitude && longitude
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null;

  const mapsEmbedUrl = latitude && longitude
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x300&markers=color:red%7C${latitude},${longitude}&key=AIzaSyB9dtJwoDszhkMZ2CeD8hR-S-C06CmrfEE`
    : null;

  return (
    <div className="rounded-xl overflow-hidden shadow-lg bg-white border border-gray-200">
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
          <div className="flex-1 text-start">
            <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm sm:hidden">
                 <MapPin className="w-5 h-5 text-white" />
               </div>
               <h4 dir="auto" className="text-2xl sm:text-3xl font-bold text-white dynamic-content leading-tight">
                {title || 'Event Venue'}
              </h4>
            </div>
            {subtitle && (
              <p dir="auto" className="text-blue-100 text-base dynamic-content mb-2">
                {subtitle}
              </p>
            )}
            {latitude && longitude && (
              <div className="flex items-center gap-2 text-blue-200/80 text-xs font-mono bg-black/10 w-fit px-2 py-1 rounded">
                <Info className="w-3 h-3" />
                <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-3 shrink-0">
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                {copy.openInMaps}
              </a>
            )}
            {latitude && longitude && (
              <button
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(`${latitude}, ${longitude}`);
                    alert('Coordinates copied to clipboard');
                  }
                }}
                className="px-6 py-3 bg-blue-500/40 text-white border border-white/20 backdrop-blur-md rounded-xl font-bold text-sm hover:bg-blue-500/60 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                <MapPin className="w-4 h-4" />
                {copy.shareCoords}
              </button>
            )}
          </div>
        </div>
      </div>

      {mapsEmbedUrl && (
        <div className="relative h-64 sm:h-80 bg-gray-100 overflow-hidden">
          <img
            src={mapsEmbedUrl}
            alt="Event venue map"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" dir="ltr">
          <div className="group p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-default">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0 text-start">
                <h5 dir="auto" className="font-bold text-gray-900 mb-1 text-sm dynamic-content">{copy.gettingThere}</h5>
                <p dir="auto" className="text-gray-600 text-xs leading-relaxed dynamic-content">
                  {copy.gettingThereDesc}
                </p>
              </div>
            </div>
          </div>

          <div className="group p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 cursor-default">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors flex-shrink-0">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0 text-start">
                <h5 dir="auto" className="font-bold text-gray-900 mb-1 text-sm dynamic-content">{copy.arriveEarly}</h5>
                <p dir="auto" className="text-gray-600 text-xs leading-relaxed dynamic-content">
                  {copy.arriveEarlyDesc}
                </p>
              </div>
            </div>
          </div>

          <div className="group p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-default">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors flex-shrink-0">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0 text-start">
                <h5 dir="auto" className="font-bold text-gray-900 mb-1 text-sm dynamic-content">{copy.parking}</h5>
                <p dir="auto" className="text-gray-600 text-xs leading-relaxed dynamic-content">
                  {copy.parkingDesc}
                </p>
              </div>
            </div>
          </div>

          <div className="group p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 cursor-default">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors flex-shrink-0">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0 text-start">
                <h5 dir="auto" className="font-bold text-gray-900 mb-1 text-sm dynamic-content">{copy.accessibility}</h5>
                <p dir="auto" className="text-gray-600 text-xs leading-relaxed dynamic-content">
                  {copy.accessibilityDesc}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
            <div className="text-start">
              <h5 dir="auto" className="font-bold text-gray-900 mb-2 dynamic-content">{copy.needDirections}</h5>
              <p dir="auto" className="text-gray-600 text-sm mb-4 dynamic-content">
                {copy.needDirectionsDesc}
              </p>
              <div className="flex flex-col sm:flex-row gap-3" dir="ltr">
                <button
                  onClick={() => {
                    if (mapsUrl) {
                      window.open(mapsUrl, '_blank');
                    }
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
                >
                  {copy.getDirections}
                </button>
                <a
                  href="mailto:support@future-cards.com"
                  className="flex-1 sm:flex-none px-4 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors"
                >
                  {copy.contactSupport}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
