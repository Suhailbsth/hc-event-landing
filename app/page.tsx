import { fetchAllEvents } from '@/lib/eventApi';
import HomePageClient from '@/components/HomePageClient';

export default async function Home() {
  let events: any[] = [];
  
  try {
    events = await fetchAllEvents();
  } catch (error) {
    console.error('Failed to load events:', error);
  }

  return <HomePageClient events={events} />;
}
