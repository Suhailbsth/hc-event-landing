// Organizer API Service for Next.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5237';

export interface OrganizerUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  companyId: string;
}

export interface OrganizerLoginResponse {
  token: string;
  user: OrganizerUser;
  expiresAt: string;
}

export interface OrganizerEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: string;
  gates: EventGate[];
  organizerRole?: string;
}

export interface EventGate {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  currentOrganizer?: string;
}

export interface GateSession {
  id: string;
  eventId: string;
  gateId: string;
  gateName: string;
  sessionStartTime: string;
  checkInCount: number;
  isActive: boolean;
}

export interface AttendeeCheckIn {
  userId: string;
  fullName?: string;
  email?: string;
  ticketType?: string;
  checkInTime: string;
  gateName: string;
  organizerName: string;
}

class OrganizerApiService {
  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('organizerToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Login as organizer
   */
  async login(username: string, password: string): Promise<OrganizerLoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/Organizer/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  /**
   * Get events assigned to the organizer
   */
  async getMyEvents(): Promise<OrganizerEvent[]> {
    const response = await fetch(`${API_BASE_URL}/api/Organizer/events`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }

    return response.json();
  }

  /**
   * Start a gate session
   */
  async startGateSession(eventId: string, gateId: string): Promise<GateSession> {
    const response = await fetch(`${API_BASE_URL}/api/Organizer/session/start`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ eventId, gateId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start session');
    }

    return response.json();
  }

  /**
   * Get active session for organizer
   */
  async getActiveSession(): Promise<GateSession | null> {
    const response = await fetch(`${API_BASE_URL}/api/Organizer/session/active`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch active session');
    }

    return response.json();
  }

  /**
   * End the current gate session
   */
  async endGateSession(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/Organizer/session/end`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to end session');
    }
  }

  /**
   * Send heartbeat to keep session alive
   */
  async sendHeartbeat(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/Organizer/session/heartbeat`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      console.warn('Heartbeat failed');
    }
  }

  /**
   * Check in an attendee
   */
  async checkInAttendee(qrCode: string): Promise<AttendeeCheckIn> {
    const response = await fetch(`${API_BASE_URL}/api/Event/check-in`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ qrCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Check-in failed');
    }

    return response.json();
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('organizerToken');
      localStorage.removeItem('organizerUser');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('organizerToken');
  }

  /**
   * Get current user info
   */
  getCurrentUser(): OrganizerUser | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('organizerUser');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const organizerApi = new OrganizerApiService();
