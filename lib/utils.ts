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
          url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.landingPageSlug}`,
        }
      : {
          '@type': 'Offer',
          price: event.regularPrice.toString(),
          priceCurrency: event.currency,
          availability: 'https://schema.org/InStock',
          url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.landingPageSlug}`,
        },
  };
}
