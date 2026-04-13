import { cookies } from 'next/headers';
import { Loader2 } from 'lucide-react';
import { eventPageTranslations } from '@/lib/translations';

export default async function Loading() {
  const cookieStore = await cookies();
  const language = cookieStore.get('eventLang')?.value === 'ar' ? 'ar' : 'en';
  const copy = eventPageTranslations[language];

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{copy.loadingEvent}</h2>
        <p className="text-gray-600">{copy.loadingEventDetails}</p>
      </div>
    </div>
  );
}
