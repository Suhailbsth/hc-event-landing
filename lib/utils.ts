import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { EventData } from './eventApi';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date range for display
 */
export function formatDateRange(
  startDate: string,
  endDate: string,
  locale: string = 'en-US'
): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };

  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString(locale, options);
  }

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString(locale, { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString(locale, { day: 'numeric', year: 'numeric' })}`;
  }

  return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, options)}`;
}

/**
 * Format time for display
 */
export function formatTime(time?: string, locale: string = 'en-US'): string {
  if (!time) return '';

  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));

  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: locale === 'en-US',
  });
}

/**
 * Generate event JSON-LD structured data for SEO
 */
export function generateEventJsonLd(event: EventData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || event.shortDescription,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.venue || event.location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.city,
        addressCountry: event.country,
      },
    },
    image: event.bannerImageUrl ? [event.bannerImageUrl] : [],
    organizer: {
      '@type': 'Organization',
      name: 'Future Cards',
      url: process.env.NEXT_PUBLIC_APP_URL,
    },
    offers: event.isFree
      ? {
        '@type': 'Offer',
        price: '0',
        priceCurrency: event.currency,
        availability: 'https://schema.org/InStock',
        url: buildEventWebsiteUrl(event.title, event.landingPageSlug),
      }
      : {
        '@type': 'Offer',
        price: event.regularPrice.toString(),
        priceCurrency: event.currency,
        availability: 'https://schema.org/InStock',
        url: buildEventWebsiteUrl(event.title, event.landingPageSlug),
      },
  };
}

/**
 * Build event landing page URL by appending event route segments to a single base URL.
 * Uses a single configured host instead of dynamic title-based subdomains.
 * 
 * @param eventTitle - The title of the event (used as fallback slug)
 * @param landingPageSlug - The slug for the landing page (preferred over title-based slug)
 * @returns The full URL for the event landing page
 */
export function buildEventWebsiteUrl(
  eventTitle: string,
  landingPageSlug?: string
): string {
  // Get base URL from environment, with graceful fallback for development/preview
  const rawBaseUrl = process.env.NEXT_PUBLIC_EVENT_LANDING_BASE_URL;
  
  if (!rawBaseUrl || !rawBaseUrl.trim()) {
    // Fallback for development/preview environments
    const fallbackBase = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://uat-events.future-cards.com';
    
    console.warn(
      'NEXT_PUBLIC_EVENT_LANDING_BASE_URL is not set. Using fallback:',
      fallbackBase
    );
    
    const baseUrl = fallbackBase.trim().replace(/\/+$/, '');
    const finalSlug = (landingPageSlug?.trim() || eventTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')).trim();

    return !finalSlug ? `${baseUrl}/` : `${baseUrl}/events/${finalSlug}/`;
  }

  const baseUrl = rawBaseUrl.trim().replace(/\/+$/, '');

  const fallbackSlug = eventTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const finalSlug = (landingPageSlug?.trim() || fallbackSlug).trim();

  if (!finalSlug) {
    return `${baseUrl}/`;
  }

  return `${baseUrl}/events/${finalSlug}/`;
}
