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

      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Check-in failed";
      setError(message);

      // Vibrate for error (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(500);
      }
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
          <div className="mb-6 flex justify-center">
            <button
              onClick={() => setCameraActive(!cameraActive)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                cameraActive
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {cameraActive ? "📷 Stop Camera" : "📷 Start Camera"}
            </button>
          </div>

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
