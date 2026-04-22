/**
 * ScannerCache — Offline-First Visitor Store
 *
 * Holds a preloaded snapshot of all visitors for the current event in a
 * JavaScript Map for O(1) lookups (<1ms per scan). Populated once when the
 * organizer opens the scanner page, then consulted locally on every scan
 * with zero network latency.
 *
 * Retry Queue: Failed background syncs are stored in localStorage and
 * automatically replayed when the network comes back online.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://digital-id-api.azurewebsites.net';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface VisitorRecord {
  /** First 12 hex chars of registrationId — matches QR code segment 1 */
  id: string;
  /** First 8 hex chars of eventId — matches QR code segment 2 */
  eid: string;
  /** 12-char HMAC token — matches QR code segment 3 */
  tok: string;
  name: string;
  email: string;
  /** "regular" | "vip" | "speaker" | "exhibitor" */
  type: string;
  checkedIn: boolean;
  /** Cosmos DB ETag captured at preload time — used for optimistic concurrency */
  etag: string;
}

export interface PreloadResponse {
  eventId: string;
  generatedAt: string;
  etag: string;
  visitorCount: number;
  visitors: VisitorRecord[];
}

export interface FastCheckInPayload {
  visitorIdShort: string;
  eventIdShort: string;
  token: string;
  eventId: string;
  gateId: string;
  gateName: string;
  gateType: string;
  sessionId: string;
  scannerName: string;
  scannedAt: string;
  etag: string;
}

export interface FastCheckInResult {
  success: boolean;
  isDuplicate: boolean;
  duplicateGate?: string;
  message?: string;
  updatedEtag?: string;
  checkedInState?: boolean;
  actionType?: string;
  checkedInAt?: string;
}

interface PendingSync {
  payload: FastCheckInPayload;
  retries: number;
  queuedAt: number;
}

const PENDING_SYNC_KEY = 'scanner_pending_syncs';

// ──────────────────────────────────────────────────────────────
// ScannerCache
// ──────────────────────────────────────────────────────────────

class ScannerCache {
  private visitors = new Map<string, VisitorRecord>();
  private currentEventId: string | null = null;
  private loaded = false;
  private loading = false;

  // ── Status ──────────────────────────────────────────────────

  isLoaded(): boolean { return this.loaded; }
  isLoading(): boolean { return this.loading; }
  getCount(): number { return this.visitors.size; }
  getEventId(): string | null { return this.currentEventId; }

  // ── Preload ─────────────────────────────────────────────────

  /**
   * Fetches all visitors for the event from the backend and populates the local Map.
   * Called once when the organizer's scanner page loads.
   * @returns Number of visitors loaded.
   */
  async preload(eventId: string, authToken: string): Promise<number> {
    if (this.loading) return this.visitors.size;
    if (this.loaded && this.currentEventId === eventId) return this.visitors.size;

    this.loading = true;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/Organizer/events/${eventId}/visitors/preload`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Preload failed: ${response.status} ${response.statusText}`);
      }

      const data: PreloadResponse = await response.json();

      this.visitors.clear();
      for (const v of data.visitors) {
        this.visitors.set(v.id.toLowerCase(), v);
      }

      this.currentEventId = eventId;
      this.loaded = true;
      console.log(`[ScannerCache] Preloaded ${this.visitors.size} visitors for event ${eventId}`);

      // Drain any pending syncs from previous offline sessions
      this.drainRetryQueue(authToken);

      return this.visitors.size;
    } finally {
      this.loading = false;
    }
  }

  // ── Lookup ──────────────────────────────────────────────────

  /**
   * O(1) local lookup. Returns null if the visitor is not registered.
   */
  lookup(shortId: string): VisitorRecord | null {
    return this.visitors.get(shortId.toLowerCase()) ?? null;
  }

  /**
   * Marks a visitor as checked-in (or checked-out) in the local Map immediately.
   * Called before the background API sync so the UI is instant.
   */
  markCheckedIn(shortId: string, state: boolean = true): void {
    const v = this.visitors.get(shortId.toLowerCase());
    if (v) {
      this.visitors.set(shortId.toLowerCase(), { ...v, checkedIn: state });
    }
  }

  /**
   * Applies server-authoritative state after background sync to avoid stale ETag drift.
   */
  reconcileVisitor(shortId: string, updatedEtag?: string, checkedInState?: boolean): void {
    const key = shortId.toLowerCase();
    const current = this.visitors.get(key);
    if (!current) return;

    this.visitors.set(key, {
      ...current,
      etag: updatedEtag ?? current.etag,
      checkedIn: checkedInState ?? current.checkedIn,
    });
  }

  // ── QR Parsing ──────────────────────────────────────────────

  /**
   * Checks whether the raw scanned string is the new compact format.
   * Format: {12 hex}|{8 hex}|{12 hex}
   */
  static isTinyFormat(raw: string): boolean {
    return /^[0-9a-f]{12}\|[0-9a-f]{8}\|[0-9a-f]{12}$/i.test(raw.trim());
  }

  /**
   * Parses a compact QR string into its three segments.
   */
  static parseTinyQR(raw: string): { rid: string; eid: string; tok: string } | null {
    const parts = raw.trim().split('|');
    if (parts.length !== 3) return null;
    return { rid: parts[0].toLowerCase(), eid: parts[1].toLowerCase(), tok: parts[2].toLowerCase() };
  }

  // ── Background Sync ─────────────────────────────────────────

  /**
   * Fire-and-forget POST to /api/CheckIn/fast.
   * If it fails (network error) the payload is saved to localStorage for retry.
   */
  async syncToBackend(payload: FastCheckInPayload, authToken: string): Promise<FastCheckInResult> {
    const tStart = performance.now();
    try {
      const response = await fetch(`${API_BASE_URL}/api/CheckIn/fast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 409) {
        // ETag conflict — another gate checked them in first (not an error)
        const body = await response.json().catch(() => ({}));
        this.reconcileVisitor(payload.visitorIdShort, body.updatedEtag, body.checkedInState);
        return {
          success: true,
          isDuplicate: true,
          duplicateGate: body.gate,
          updatedEtag: body.updatedEtag,
          checkedInState: body.checkedInState,
          checkedInAt: body.checkedInAt,
          actionType: body.actionType,
        };
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody.message || `Sync failed: ${response.status}`;
        throw new Error(message);
      }

      const body = await response.json().catch(() => ({}));
      this.reconcileVisitor(payload.visitorIdShort, body.updatedEtag, body.checkedInState);

      const duration = performance.now() - tStart;
      console.log(`[ScannerCache] Background sync success for ${payload.visitorIdShort} in ${duration.toFixed(2)}ms`);
      return {
        success: true,
        isDuplicate: false,
        updatedEtag: body.updatedEtag,
        checkedInState: body.checkedInState,
        checkedInAt: body.checkedInAt,
        actionType: body.actionType,
      };
    } catch (err) {
      // Network down or API error — queue for retry
      const duration = performance.now() - tStart;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`[ScannerCache] Background sync FAILED (queued) in ${duration.toFixed(2)}ms: ${errorMessage}`);
      this.enqueueForRetry(payload);
      return { success: false, isDuplicate: false, message: errorMessage };
    }
  }

  // ── Retry Queue ──────────────────────────────────────────────

  private enqueueForRetry(payload: FastCheckInPayload): void {
    const pending: PendingSync[] = this.loadRetryQueue();
    pending.push({ payload, retries: 0, queuedAt: Date.now() });
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
    console.log(`[ScannerCache] Queued sync for ${payload.visitorIdShort} (offline)`);
  }

  private loadRetryQueue(): PendingSync[] {
    try {
      return JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '[]');
    } catch {
      return [];
    }
  }

  async drainRetryQueue(authToken: string): Promise<void> {
    const pending = this.loadRetryQueue();
    if (pending.length === 0) return;

    console.log(`[ScannerCache] Draining ${pending.length} pending syncs...`);
    const remaining: PendingSync[] = [];

    for (const item of pending) {
      const result = await this.syncToBackend(item.payload, authToken).catch(() => null);
      if (!result?.success && item.retries < 5) {
        remaining.push({ ...item, retries: item.retries + 1 });
      }
    }

    if (remaining.length > 0) {
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(PENDING_SYNC_KEY);
    }
  }

  // ── Reset ────────────────────────────────────────────────────

  reset(): void {
    this.visitors.clear();
    this.currentEventId = null;
    this.loaded = false;
    this.loading = false;
  }
}

// Singleton export — shared across all components on the page
export const scannerCache = new ScannerCache();
export { ScannerCache };
