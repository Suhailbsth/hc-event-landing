import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchEventBySlug } from '@/lib/eventApi';
import { generateEventJsonLd } from '@/lib/utils';
import EventPageClient from '@/components/EventPageClient';

interface EventPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

/**
 * Generate SEO metadata for the event page
 */
export async function generateMetadata({
  params,
  searchParams,
}: EventPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const event = await fetchEventBySlug(resolvedParams.slug);
    const lang = resolvedSearchParams.lang || 'en';
    const isArabic = lang === 'ar';

    const title = isArabic && event.titleAr ? event.titleAr : event.title;
    const description =
      isArabic && event.descriptionAr
        ? event.descriptionAr
        : event.description || event.shortDescription;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const eventUrl = `${appUrl}/events/${resolvedParams.slug}`;

    return {
      title: `${title} - Future Cards Events`,
      description: description,
      keywords: [
        title,
        event.venue || '',
        event.city || '',
        event.country || '',
        'events',
        'registration',
        'digital pass',
      ].filter(Boolean),
      openGraph: {
        title: title,
        description: description,
        url: eventUrl,
        siteName: 'Future Cards Events',
        images: event.bannerImageUrl
          ? [
              {
                url: event.bannerImageUrl,
                width: 1200,
                height: 630,
                alt: title,
              },
            ]
          : [],
        locale: isArabic ? 'ar_AE' : 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: event.bannerImageUrl ? [event.bannerImageUrl] : [],
      },
      alternates: {
        canonical: eventUrl,
        languages: {
          'en-US': `${eventUrl}?lang=en`,
          'ar-AE': `${eventUrl}?lang=ar`,
        },
      },
    };
  } catch (error) {
    return {
      title: 'Event Not Found - Future Cards',
      description: 'The requested event could not be found.',
    };
  }
}

/**
 * Event landing page with server-side rendering
 */
export default async function EventPage({
  params,
  searchParams,
}: EventPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  let event;

  try {
    event = await fetchEventBySlug(resolvedParams.slug);
  } catch (error) {
    notFound();
  }

  const lang = resolvedSearchParams.lang || 'en';
  const jsonLd = generateEventJsonLd(event);

  return (
    <>
      {/* JSON-LD structured data for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen">
        <EventPageClient event={event} />

        {/* Event Description Section */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Event Details */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {lang === 'ar' && event.titleAr ? 'حول الفعالية' : 'About the Event'}
                </h2>
                <div
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html:
                      (lang === 'ar' && event.descriptionAr
                        ? event.descriptionAr
                        : event.description || event.shortDescription) || '',
                  }}
                />
              </div>

              {/* Event Highlights */}
              {event.highlights && event.highlights.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {lang === 'ar' ? 'أبرز الأحداث' : 'Event Highlights'}
                  </h3>
                  <ul className="space-y-2">
                    {event.highlights.map((highlight: string, index: number) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-gray-700"
                      >
                        <span className="text-green-600 mt-1">✓</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Agenda */}
              {event.agenda && event.agenda.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {lang === 'ar' ? 'جدول الأعمال' : 'Agenda'}
                  </h3>
                  <div className="space-y-3">
                    {event.agenda.map((item, index: number) => (
                      <div
                        key={index}
                        className="border-l-2 border-blue-600 pl-4 py-2"
                      >
                        <div className="text-sm text-gray-500 font-medium">
                          {item.time}
                        </div>
                        <div className="text-gray-900 font-medium">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-sm text-gray-600 mt-1">
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
      </main>
    </>
  );
}
