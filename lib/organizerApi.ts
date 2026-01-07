// Organizer API Service for Next.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5237';
export interface InviteOrganizerRequest {
  email: string;
  fullName?: string;
  notes?: string;
}
export interface InviteOrganizerResponse {
  message: string;
  organizer: {
    id: string;
    eventId: string;
    userEmail: string;
    fullName?: string;
    invitationStatus: string;
    invitationSentAt: string;
    invitationExpiresAt: string;
  };
}


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
  eventId: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: string;
  gates: EventGate[];
  organizerRole?: string;
}

export interface EventGate {
  gateId: string;
  name: string;
  description?: string;
  isActive: boolean;
  currentOrganizer?: string;
}

export interface DetailedEventGate {
  gateId: string;
  name: string;
  type: string;
  location: string;
  capacity: number;
  isActive: boolean;
  currentOrganizer?: string;
}

export interface GateSession {
  sessionId: string;
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
  isDuplicate?: boolean;
}


export async function inviteOrganizer(
  eventId: string,
  request: InviteOrganizerRequest,
  token: string
): Promise<InviteOrganizerResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/Organizer/event/${eventId}/invite`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to invite organizer');
  }
  return await response.json();
}

export async function getEventOrganizers(
  eventId: string,
  token: string
): Promise<unknown[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/Organizer/event/${eventId}/organizers`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  if (!response.ok) {
    throw new Error('Failed to fetch organizers');
  }
  return await response.json();
}

class OrganizerApiService {
  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (includeAuth && typeof window !== "undefined") {
      const token = localStorage.getItem("organizerToken");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Login as organizer
   */
  async login(
    username: string,
    password: string
  ): Promise<OrganizerLoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/Organizer/login`, {
      method: "POST",
      headers: this.getHeaders(false),
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    return response.json();
  }

  /**
   * Get events assigned to the organizer
   */
  async getMyEvents(): Promise<OrganizerEvent[]> {
    const response = await fetch(`${API_BASE_URL}/api/Organizer/events`, {
      method: "GET",
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }

    return response.json();
  }

  /**
   * Get detailed gates for a specific event
   */
  async getDetailedGatesForEvent(eventId: string): Promise<DetailedEventGate[]> {
    const response = await fetch(`${API_BASE_URL}/api/Organizer/events/${eventId}/gates`, {
      method: "GET",
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch gates");
    }

    return response.json();
  }

  /**
   * Start a gate session
   */
  async startGateSession(
    eventId: string,
    gateId: string
  ): Promise<GateSession> {
    const response = await fetch(
      `${API_BASE_URL}/api/Organizer/session/start`,
      {
        method: "POST",
        headers: this.getHeaders(true),
        body: JSON.stringify({ eventId, gateId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to start session");
    }

    return response.json();
  }

  /**
   * Get active session for organizer
   */
  async getActiveSession(eventId: string): Promise<GateSession | null> {
    const response = await fetch(
      `${API_BASE_URL}/api/Organizer/session/active?eventId=${eventId}`,
      {
        method: "GET",
        headers: this.getHeaders(true),
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch active session");
    }

    return response.json();
  }

  /**
   * End the current gate session
   */
  async endGateSession(eventId: string, sessionId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/Organizer/session/end?eventId=${eventId}&sessionId=${sessionId}`,
      {
        method: "POST",
        headers: this.getHeaders(true),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to end session");
    }
  }

  /**
   * Send heartbeat to keep session alive
   */
  async sendHeartbeat(): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/Organizer/session/heartbeat`,
      {
        method: "POST",
        headers: this.getHeaders(true),
      }
    );

    if (!response.ok) {
      console.warn("Heartbeat failed");
    }
  }

  /**
   * Check in an attendee - validates wallet QR codes with JWT tokens and performs check-in
   */
  async checkInAttendee(qrCode: string): Promise<AttendeeCheckIn> {
    // Get active session to get eventId and gate info
    // This assumes the organizer has an active session
    const activeSession = await this.getActiveSessionAny();
    if (!activeSession) {
      throw new Error("No active gate session. Please start a session first.");
    }

    // Step 1: Validate the QR code
    const validateResponse = await fetch(`${API_BASE_URL}/api/EventRegistration/validate`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify({
        qrCodeContent: qrCode,
        eventId: activeSession.eventId,
        deviceId: activeSession.sessionId,
        gateId: activeSession.gateId,
        gate: activeSession.gateName,
      }),
    });

    if (!validateResponse.ok) {
      let error;
      try {
        error = await validateResponse.json();
      } catch {
        throw new Error(`Validation failed: ${validateResponse.status} ${validateResponse.statusText}`);
      }
      throw new Error(error.message || "QR code validation failed");
    }

    const validationResult = await validateResponse.json();

    // Check if validation failed
    if (!validationResult.isValid) {
      throw new Error(validationResult.message || "Invalid QR code");
    }

    // Check if already checked in
    if (validationResult.alreadyCheckedIn) {
      // Return the existing check-in info
      return {
        userId: validationResult.registrationId,
        fullName: validationResult.guestName,
        email: validationResult.guestEmail,
        ticketType: validationResult.registrationType,
        checkInTime: validationResult.previousCheckInTime,
        gateName: validationResult.previousCheckInGate || activeSession.gateName,
        organizerName: "",
        isDuplicate: true,
      };
    }

    // Step 2: Perform the actual check-in
    const checkInResponse = await fetch(`${API_BASE_URL}/api/EventRegistration/check-in`, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify({
        registrationId: validationResult.registrationId,
        eventId: activeSession.eventId,
        gateId: activeSession.gateId,
        gateName: activeSession.gateName,
        checkInGate: activeSession.gateName,
        scannerDeviceId: activeSession.sessionId,
        scannerUserName: this.getCurrentUser()?.fullName || "Organizer",
        passType: validationResult.passType,
        entityId: validationResult.entityId,
      }),
    });

    if (!checkInResponse.ok) {
      let error;
      try {
        error = await checkInResponse.json();
      } catch {
        throw new Error(`Check-in failed: ${checkInResponse.status} ${checkInResponse.statusText}`);
      }
      throw new Error(error.message || "Check-in failed");
    }

    const checkInResult = await checkInResponse.json();

    // Return the check-in info
    return {
      userId: validationResult.registrationId,
      fullName: validationResult.guestName,
      email: validationResult.guestEmail,
      ticketType: validationResult.registrationType,
      checkInTime: checkInResult.checkIn?.checkInTime || new Date().toISOString(),
      gateName: activeSession.gateName,
      organizerName: this.getCurrentUser()?.fullName || "",
      isDuplicate: false,
    };
  }

  /**
   * Get active session for any event (helper method)
   */
  private async getActiveSessionAny(): Promise<GateSession | null> {
    const events = await this.getMyEvents();
    for (const event of events) {
      const session = await this.getActiveSession(event.eventId);
      if (session) {
        return session;
      }
    }
    return null;
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("organizerToken");
      localStorage.removeItem("organizerUser");
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("organizerToken");
  }

  /**
   * Get current user info
   */
  getCurrentUser(): OrganizerUser | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("organizerUser");
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const organizerApi = new OrganizerApiService();
