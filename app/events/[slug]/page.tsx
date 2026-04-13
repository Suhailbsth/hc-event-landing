import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchEventBySlug } from '@/lib/eventApi';
import { generateEventJsonLd, buildEventWebsiteUrl } from '@/lib/utils';
import EventPageClient from '@/components/EventPageClient';

interface EventPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

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

    const title = isArabic
      ? event.arabicTitle || event.titleAr || event.title
      : event.title;
    const description = isArabic
      ? event.arabicDescription || event.descriptionAr || event.description || event.shortDescription
      : event.description || event.shortDescription;

    const eventUrl = buildEventWebsiteUrl(event.title, resolvedParams.slug);

    return {
      title: `${title} - Future Cards Events`,
      description,
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
        title,
        description,
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
        title,
        description,
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
  } catch {
    return {
      title: 'Event Not Found - Future Cards',
      description: 'The requested event could not be found.',
    };
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const resolvedParams = await params;
  let event;

  try {
    event = await fetchEventBySlug(resolvedParams.slug);
  } catch {
    notFound();
  }

  const jsonLd = generateEventJsonLd(event);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="w-full flex flex-col bg-white">
        <EventPageClient event={event} />
      </main>
    </>
  );
}
