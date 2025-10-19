// Event Management API Service for Next.js
// Server and Client compatible

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export interface EventData {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  shortDescription?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  venue?: string;
  city?: string;
  country?: string;
  capacity: number;
  maxVIPSeats: number;
  isFree: boolean;
  regularPrice: number;
  vipPrice: number;
  earlyBirdPrice: number;
  earlyBirdDeadline?: string;
  currency: string;
  status: string;
  
  // Multi-language
  languages?: string[];
  titleAr?: string;
  descriptionAr?: string;
  shortDescriptionAr?: string;
  locationAr?: string;
  venueAr?: string;
  arabicTitle?: string;
  arabicDescription?: string;
  arabicShortDescription?: string;
  arabicLocation?: string;
  arabicVenue?: string;
  
  // Content
  highlights?: string[];
  agenda?: Array<{
    time: string;
    title: string;
    description?: string;
  }>;
  
  // Statistics
  totalRegistrations: number;
  vipRegistrations: number;
  regularRegistrations: number;
  totalCheckIns: number;
  
  // Landing Page
  landingPageSlug?: string;
  customDomain?: string;
  
  // Settings
  requireApproval: boolean;
  allowGuestAddition: boolean;
  registrationOpen: boolean;
  registrationDeadline?: string;
  
  // Branding
  bannerImageUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  
  // Meta
  createdAt: string;
  createdBy?: string;
}

export interface RegistrationRequest {
  eventId: string;
  companyId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  city?: string;
  country?: string;
  registrationType?: 'regular' | 'vip';
  vipPackages?: string[];
  dietaryRequirements?: string;
  specialRequests?: string;
  registrationSource?: string;
  referralCode?: string;
}

export interface RegistrationResponse {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  passSerialNumber?: string;
  qrCodeUrl?: string;
  registrationDate: string;
  amount: number;
  currency: string;
  paymentStatus: string;
}

/**
 * Fetch event details by slug (Server-side or Client-side)
 * Use cache: 'no-store' for always fresh data
 * Use cache: 'force-cache' or revalidate for ISR
 */
export async function fetchEventBySlug(
  slug: string,
  options?: RequestInit
): Promise<EventData> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/Event/slug/${slug}`,
      {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Event not found: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching event by slug:', error);
    throw error;
  }
}

/**
 * Fetch event details by ID
 */
export async function fetchEventById(
  eventId: string,
  companyId: string,
  options?: RequestInit
): Promise<EventData> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/Event/${eventId}?companyId=${companyId}`,
      {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Event not found: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching event by ID:', error);
    throw error;
  }
}

/**
 * Register for an event (Client-side only)
 */
export async function registerForEvent(
  registrationData: RegistrationRequest
): Promise<{ success: boolean; message: string; registration: RegistrationResponse }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/EventRegistration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Registration failed: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('Error registering for event:', error);
    throw error;
  }
}

/**
 * Fetch all active events (for homepage)
 */
export async function fetchAllEvents(
  companyId?: string,
  options?: RequestInit
): Promise<EventData[]> {
  try {
    const url = companyId
      ? `${API_BASE_URL}/api/Event?companyId=${companyId}&take=100`
      : `${API_BASE_URL}/api/Event?take=100`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching all events:', error);
    return [];
  }
}
