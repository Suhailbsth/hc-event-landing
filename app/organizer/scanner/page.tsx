"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { organizerApi, GateSession, AttendeeCheckIn } from "@/lib/organizerApi";
import QRScanner from "@/components/QRScanner";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function ScannerPage() {
  const router = useRouter();
  const [session, setSession] = useState<GateSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [lastCheckIn, setLastCheckIn] = useState<AttendeeCheckIn | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<AttendeeCheckIn[]>([]);
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!organizerApi.isAuthenticated()) {
      router.push("/organizer/login");
      return;
    }

    loadActiveSession();

    // Setup heartbeat every 2 minutes
    heartbeatInterval.current = setInterval(() => {
      organizerApi.sendHeartbeat().catch(console.error);
    }, 120000); // 2 minutes

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadActiveSession = async () => {
    try {
      const eventId = localStorage.getItem("activeEventId");
      if (!eventId) {
        router.push("/organizer/events");
        return;
      }

      const activeSession = await organizerApi.getActiveSession(eventId);
      if (!activeSession) {
        router.push("/organizer/events");
        return;
      }
      setSession(activeSession);
    } catch (error) {
      console.error("Failed to load session:", error);
      setError("Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (code: string) => {
    setScanning(true);
    setError("");
    setSuccess("");

    try {
      const checkIn = await organizerApi.checkInAttendee(code);
      setLastCheckIn(checkIn);

      // Add to recent check-ins list (LIFO - newest first)
      setRecentCheckIns(prev => {
        const newCheckIn = {
          ...checkIn,
          timestamp: new Date().toISOString(), // For relative time display
          isNew: true // For highlight animation
        };
        return [newCheckIn, ...prev].slice(0, 10); // Keep only last 10
      });

      setSuccess(
        `✓ ${checkIn.fullName || "Attendee"} checked in successfully!`
      );

      // Vibrate for success (if supported)
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      // Update check-in count
      if (session) {
        setSession({
          ...session,
          checkInCount: session.checkInCount + 1,
        });
      }

      // Auto-close camera after successful scan
      setCameraActive(false);

      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);

      // Remove highlight animation after 2 seconds
      setTimeout(() => {
        setRecentCheckIns(prev => prev.map(item => ({ ...item, isNew: false })));
      }, 2000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Check-in failed";
      setError(message);

      // Vibrate for error (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(500);
      }

      // Don't close camera on error - let user try again
    } finally {
      setScanning(false);
      setQrCode("");
    }
  };

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrCode.trim()) {
      handleCheckIn(qrCode.trim());
    }
  };

  const handleEndSession = async () => {
    setShowEndSessionDialog(true);
  };

  const confirmEndSession = async () => {
    setShowEndSessionDialog(false);
    try {
      const eventId = localStorage.getItem("activeEventId");
      const sessionId = session?.sessionId;
      if (eventId && sessionId) {
        await organizerApi.endGateSession(eventId, sessionId);
      } else {
        throw new Error("Missing event or session ID");
      }
      // Clear stored eventId
      localStorage.removeItem("activeEventId");
      router.push("/organizer/events");
    } catch (error) {
      console.error("Failed to end session:", error);
      setError("Failed to end session");
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSessionDuration = () => {
    if (!session) return "0m";
    const start = new Date(session.sessionStartTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60);
    return `${diff}m`;
  };

  const getRelativeTime = (timestamp?: string) => {
    if (!timestamp) return "Just now";

    const now = new Date();
    const checkInTime = new Date(timestamp);
    const diffMs = now.getTime() - checkInTime.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 10) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return checkInTime.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading scanner...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">No active session found</p>
          <button
            onClick={() => router.push("/organizer/events")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {session.gateName}
                </h1>
                <p className="text-sm text-gray-600">
                  Session started at {formatTime(session.sessionStartTime)} •
                  Duration: {getSessionDuration()}
                </p>
              </div>
            </div>
            <button
              onClick={handleEndSession}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              End Session
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">
                {session.checkInCount}
              </p>
              <p className="text-sm text-gray-600">Check-ins</p>
            </div>
            <div className="h-12 w-px bg-gray-300"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {session.isActive ? "Active" : "Inactive"}
              </p>
              <p className="text-sm text-gray-600">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg animate-pulse">
            <p className="text-lg font-semibold text-green-800 text-center">
              {success}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Scanner Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Scan QR Code</h2>
            <p className="text-gray-600 mt-2">
              Use camera to scan or enter code manually
            </p>
          </div>

          {/* Camera Toggle */}
          <div className="mb-6 flex justify-center gap-3">
            <button
              onClick={() => setCameraActive(!cameraActive)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${cameraActive
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
            >
              {cameraActive ? "📷 Stop Camera" : "📷 Start Camera"}
            </button>

            {/* QR Code Upload */}
            <label className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-green-700 transition">
              📤 Upload QR
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={scanning}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setScanning(true);
                  setError("");

                  try {
                    // Dynamically import Html5Qrcode
                    const { Html5Qrcode } = await import("html5-qrcode");
                    const html5QrCode = new Html5Qrcode("qr-file-reader");
                    const decodedText = await html5QrCode.scanFile(file, false);
                    await handleCheckIn(decodedText);
                    e.target.value = ""; // Reset input
                  } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : "Failed to read QR code from image";
                    setError(errorMsg);
                  } finally {
                    setScanning(false);
                  }
                }}
              />
            </label>
          </div>

          {/* Hidden div for file scanning */}
          <div id="qr-file-reader" style={{ display: "none" }}></div>

          {/* QR Scanner */}
          {cameraActive && (
            <div className="mb-6">
              <QRScanner
                onScan={handleCheckIn}
                onError={(err) => setError(err)}
                isActive={cameraActive}
              />
            </div>
          )}

          {/* Manual Entry Form */}
          <div className="border-t pt-6">
            <p className="text-sm text-gray-600 text-center mb-4">
              Or enter code manually:
            </p>
            <form onSubmit={handleManualEntry} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Enter QR code..."
                  disabled={scanning}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              <button
                type="submit"
                disabled={!qrCode.trim() || scanning}
                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanning ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Check In Attendee"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Last Check-in Info */}
        {lastCheckIn && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Last Check-in
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">
                  {lastCheckIn.fullName}
                </span>
              </div>
              {lastCheckIn.email && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">
                    {lastCheckIn.email}
                  </span>
                </div>
              )}
              {lastCheckIn.ticketType && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Ticket:</span>
                  <span className="font-medium text-gray-900">
                    {lastCheckIn.ticketType}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium text-gray-900">
                  {formatTime(lastCheckIn.checkInTime)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Check-ins List */}
        {recentCheckIns.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Check-ins ({recentCheckIns.length})
            </h3>
            <div className="space-y-2">
              {recentCheckIns.map((checkIn, index) => (
                <div
                  key={`${checkIn.userId}-${checkIn.timestamp || index}`}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${checkIn.isNew
                    ? "border-green-500 bg-green-50 shadow-lg"
                    : "border-gray-200 bg-gray-50"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Status Indicator */}
                      <div
                        className={`w-3 h-3 rounded-full ${checkIn.isNew ? "bg-green-500 animate-pulse" : "bg-gray-400"
                          }`}
                      />

                      {/* Name & Info */}
                      <div>
                        <p className="font-medium text-gray-900">
                          {checkIn.fullName || "Unknown"}
                        </p>
                        {checkIn.email && (
                          <p className="text-xs text-gray-600">{checkIn.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Badge & Time */}
                    <div className="flex items-center gap-2">
                      {/* Ticket Type Badge */}
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${checkIn.ticketType?.toLowerCase() === "vip"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                          }`}
                      >
                        {checkIn.ticketType?.toUpperCase() || "REGULAR"}
                      </span>

                      {/* Relative Time */}
                      <span className="text-xs text-gray-500">
                        {getRelativeTime(checkIn.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Duplicate Badge */}
                  {checkIn.isDuplicate && (
                    <div className="mt-2 flex items-center gap-1 text-orange-600">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs font-medium">Duplicate scan</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showEndSessionDialog}
        title="End Session?"
        message="Are you sure you want to end this scanning session? All current session data will be saved, but you won't be able to scan more attendees until you start a new session."
        confirmText="End Session"
        cancelText="Continue Scanning"
        variant="danger"
        onConfirm={confirmEndSession}
        onCancel={() => setShowEndSessionDialog(false)}
      />
    </div>
  );
}
