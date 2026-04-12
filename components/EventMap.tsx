'use client';

import { MapPin, Clock, Users, ExternalLink, Phone, DollarSign, Info } from 'lucide-react';

interface EventMapProps {
  latitude?: number;
  longitude?: number;
  venue?: string;
  location?: string;
}

export default function EventMap({ latitude, longitude, venue, location }: EventMapProps) {
  const mapsUrl = latitude && longitude 
    ? `https://www.google.com/maps?q=${latitude},${longitude}` 
    : null;

  const mapsEmbedUrl = latitude && longitude
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x300&markers=color:red%7C${latitude},${longitude}&key=AIzaSyB9dtJwoDszhkMZ2CeD8hR-S-C06CmrfEE`
    : null;

  return (
    <div className="rounded-xl overflow-hidden shadow-lg bg-white border border-gray-200">
      {/* Header with Action Button */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 dir="auto" className="text-2xl sm:text-3xl font-bold text-white text-start dynamic-content">{venue || 'Event Venue'}</h4>
              </div>
            </div>
            <p dir="auto" className="text-blue-100 text-base ps-15 text-start dynamic-content">{location || 'Location details'}</p>
            {latitude && longitude && (
              <p dir="auto" className="text-blue-200 text-sm mt-2 ps-15 text-start dynamic-content">
                📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Maps
              </a>
            )}
            {latitude && longitude && (
              <a
                href={`tel:+1&q=${latitude},${longitude}`}
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(`${latitude}, ${longitude}`);
                  }
                }}
                className="flex-1 sm:flex-none px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-400 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <MapPin className="w-4 h-4" />
                Share Coords
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Map Preview Section */}
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

      {/* Info Cards Section */}
      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Getting There */}
          <div className="group p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-default">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 dir="auto" className="font-bold text-gray-900 mb-1 text-sm text-start dynamic-content">Getting There</h5>
                <p dir="auto" className="text-gray-600 text-xs leading-relaxed text-start dynamic-content">
                  Public transit, parking, and rideshare options available nearby
                </p>
              </div>
            </div>
          </div>

          {/* Arrival Time */}
          <div className="group p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 cursor-default">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors flex-shrink-0">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0 text-start">
                <h5 dir="auto" className="font-bold text-gray-900 mb-1 text-sm dynamic-content">Arrive Early</h5>
                <p dir="auto" className="text-gray-600 text-xs leading-relaxed dynamic-content">
                  Plan to arrive 15-20 minutes early for smooth check-in
                </p>
              </div>
            </div>
          </div>

          {/* Parking */}
          <div className="group p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-default">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors flex-shrink-0">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0 text-start">
                <h5 dir="auto" className="font-bold text-gray-900 mb-1 text-sm dynamic-content">Parking</h5>
                <p dir="auto" className="text-gray-600 text-xs leading-relaxed dynamic-content">
                  Free parking available. Reserved spaces for accessible parking
                </p>
              </div>
            </div>
          </div>

          {/* Accessibility */}
          <div className="group p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 cursor-default">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors flex-shrink-0">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0 text-start">
                <h5 dir="auto" className="font-bold text-gray-900 mb-1 text-sm dynamic-content">Accessibility</h5>
                <p dir="auto" className="text-gray-600 text-xs leading-relaxed dynamic-content">
                  ADA compliant. Contact us for special accommodations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
            <div className="text-start">
              <h5 dir="auto" className="font-bold text-gray-900 mb-2 dynamic-content">Need Directions?</h5>
              <p dir="auto" className="text-gray-600 text-sm mb-4 dynamic-content">
                Click "Open in Maps" above to get turn-by-turn directions from your current location.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    if (mapsUrl) {
                      window.open(mapsUrl, '_blank');
                    }
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
                >
                  Get Directions
                </button>
                <a
                  href="mailto:support@future-cards.com"
                  className="flex-1 sm:flex-none px-4 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
