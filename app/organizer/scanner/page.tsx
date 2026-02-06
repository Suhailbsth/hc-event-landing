"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { organizerApi, GateSession, AttendeeCheckIn, CheckInStats } from "@/lib/organizerApi";
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
  const [allGateCheckIns, setAllGateCheckIns] = useState<AttendeeCheckIn[]>([]);
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [statistics, setStatistics] = useState<CheckInStats | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<AttendeeCheckIn | null>(null);
  const [checkInTab, setCheckInTab] = useState<"thisGate" | "allGates">("thisGate");
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!organizerApi.isAuthenticated()) {
      router.push("/organizer/login");
      return;
    }
    loadActiveSession();

    heartbeatInterval.current = setInterval(() => {
      organizerApi.sendHeartbeat().catch(console.error);
    }, 120000);

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [router]);

  useEffect(() => {
    if (session?.eventId) {
      loadStatistics();
      loadRecentCheckIns();
    }
  }, [session]);

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

  const loadStatistics = async () => {
    if (!session?.eventId) return;
    try {
      const stats = await organizerApi.getCheckInStats(session.eventId);
      setStatistics(stats);
    } catch (error) {
      console.error("Failed to load statistics:", error);
    }
  };

  const loadRecentCheckIns = async () => {
    if (!session?.eventId) return;
    try {
      const checkIns = await organizerApi.getEventCheckIns(session.eventId, 20);
      setAllGateCheckIns(checkIns);
      const gateCheckIns = session.gateName
        ? checkIns.filter(c => c.gateName === session.gateName)
        : checkIns;
      setRecentCheckIns(gateCheckIns);
      if (gateCheckIns.length > 0) {
        setLastCheckIn(gateCheckIns[0]);
      }
    } catch (error) {
      console.error("Failed to load recent check-ins:", error);
    }
  };

  const handleCheckIn = async (code: string) => {
    setScanning(true);
    setError("");
    setSuccess("");
    setDuplicateInfo(null);

    try {
      const checkIn = await organizerApi.checkInAttendee(code, session?.gateType);
      setLastCheckIn(checkIn);

      if (checkIn.isDuplicate) {
        if (checkIn.invalidReason === 'grace_period') {
          setError("⚠️ Handled: Scanned just now (Grace Period)");
          if (navigator.vibrate) navigator.vibrate(100);
        } else {
          setDuplicateInfo(checkIn);
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      } else {
        setRecentCheckIns(prev => {
          const newCheckIn = { ...checkIn, timestamp: new Date().toISOString(), isNew: true };
          return [newCheckIn, ...prev].slice(0, 10);
        });
        setAllGateCheckIns(prev => {
          const newCheckIn = { ...checkIn, timestamp: new Date().toISOString(), isNew: true };
          return [newCheckIn, ...prev].slice(0, 20);
        });

        const actionType = checkIn.actionType || 'checkin';
        if (actionType === 'checkout') {
          const durationText = checkIn.durationInside ? ` • Duration: ${checkIn.durationInside}` : '';
          setSuccess(`Checked Out: ${checkIn.guestName || "Attendee"}${durationText}`);
        } else {
          const sessionText = checkIn.sessionNumber && checkIn.sessionNumber > 1 ? ` (Session #${checkIn.sessionNumber})` : '';
          setSuccess(`Checked In: ${checkIn.guestName || "Attendee"}${sessionText}`);
        }

        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

        if (session) {
          setSession({ ...session, checkInCount: session.checkInCount + 1 });
        }

        setTimeout(() => setSuccess(""), 4000);
        setTimeout(() => {
          setRecentCheckIns(prev => prev.map(item => ({ ...item, isNew: false })));
          setAllGateCheckIns(prev => prev.map(item => ({ ...item, isNew: false })));
        }, 2000);
      }

      setCameraActive(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Check-in failed";
      setError(message);
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
      localStorage.removeItem("activeEventId");
      router.push("/organizer/events");
    } catch (error) {
      console.error("Failed to end session:", error);
      setError("Failed to end session");
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
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
    if (diffSec < 10) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    return checkInTime.toLocaleDateString();
  };

  const getGateTypeConfig = () => {
    const type = session?.gateType?.toLowerCase();
    if (type === 'entry') return { color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Entry' };
    if (type === 'exit') return { color: 'from-orange-500 to-red-600', bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Exit' };
    return { color: 'from-purple-500 to-indigo-600', bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Both' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full animate-spin border-t-purple-500 mx-auto"></div>
          <p className="mt-6 text-purple-200 font-medium">Loading scanner...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
          <p className="text-red-300 mb-4">No active session found</p>
          <button onClick={() => router.push("/organizer/events")} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold">
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const gateConfig = getGateTypeConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 text-purple-300 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-white">{session.gateName}</h1>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${gateConfig.bg} ${gateConfig.text} border border-current/30`}>
                    {gateConfig.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-purple-200/70">Started {formatTime(session.sessionStartTime)} • {getSessionDuration()}</span>
                  <button
                    onClick={() => {
                      const newType = session.gateType === 'entry' ? 'exit' : 'entry';
                      setSession({ ...session, gateType: newType });
                      if (navigator.vibrate) navigator.vibrate(50);
                    }}
                    className="text-xs font-medium text-purple-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg border border-white/10 transition-all flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Switch to {session.gateType === 'entry' ? 'Exit' : 'Entry'}
                  </button>
                </div>
              </div>
            </div>
            <button onClick={handleEndSession} className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all">
              End Session
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="relative z-10 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-12">
            <div className="text-center">
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">{session.checkInCount}</p>
              <p className="text-sm text-purple-200/60">Check-ins</p>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-400">{session.isActive ? "●" : "○"}</p>
              <p className="text-sm text-purple-200/60">{session.isActive ? "Active" : "Inactive"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Success Message */}
        {success && (
          <div className={`mb-6 p-4 rounded-xl border backdrop-blur-sm animate-pulse ${success.includes('Out') ? 'bg-orange-500/20 border-orange-500/30' : 'bg-emerald-500/20 border-emerald-500/30'
            }`}>
            <p className={`text-lg font-semibold text-center ${success.includes('Out') ? 'text-orange-300' : 'text-emerald-300'}`}>
              ✓ {success}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
            <p className="text-sm text-red-300 text-center">{error}</p>
          </div>
        )}

        {/* Scanner Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-6">
          <div className="p-8 text-center">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center ${gateConfig.bg} ${cameraActive ? 'animate-pulse' : ''}`}>
              <svg className={`w-12 h-12 ${gateConfig.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Scan QR Code</h2>
            <p className="text-purple-200/60">Use camera or enter code manually</p>
          </div>

          {/* Camera Controls */}
          <div className="px-8 pb-6 flex justify-center gap-3">
            <button
              onClick={() => setCameraActive(!cameraActive)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${cameraActive
                  ? "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                  : `bg-gradient-to-r ${gateConfig.color} text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40`
                }`}
            >
              {cameraActive ? "Stop Camera" : "📷 Start Camera"}
            </button>
            <label className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-semibold cursor-pointer hover:bg-white/20 transition-all">
              📤 Upload
              <input type="file" accept="image/*" className="hidden" disabled={scanning} onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setScanning(true);
                setError("");
                try {
                  const { Html5Qrcode } = await import("html5-qrcode");
                  const html5QrCode = new Html5Qrcode("qr-file-reader");
                  const decodedText = await html5QrCode.scanFile(file, false);
                  await handleCheckIn(decodedText);
                  e.target.value = "";
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to read QR code");
                } finally {
                  setScanning(false);
                }
              }} />
            </label>
          </div>

          <div id="qr-file-reader" style={{ display: "none" }}></div>

          {cameraActive && (
            <div className="px-8 pb-6">
              <div className="rounded-xl overflow-hidden border border-white/20">
                <QRScanner onScan={handleCheckIn} onError={(err) => setError(err)} isActive={cameraActive} />
              </div>
            </div>
          )}

          {/* Manual Entry */}
          <div className="px-8 pb-8 border-t border-white/10 pt-6">
            <form onSubmit={handleManualEntry} className="flex gap-3">
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="Enter code manually..."
                disabled={scanning}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-200/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!qrCode.trim() || scanning}
                className={`px-6 py-3 bg-gradient-to-r ${gateConfig.color} text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {scanning ? "..." : "Go"}
              </button>
            </form>
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <div className="flex bg-white/5 rounded-lg p-1">
              <button onClick={() => setCheckInTab("thisGate")} className={`px-3 py-1 text-sm font-medium rounded-md transition ${checkInTab === "thisGate" ? "bg-white/10 text-white" : "text-purple-200/60 hover:text-white"}`}>
                This Gate ({recentCheckIns.length})
              </button>
              <button onClick={() => setCheckInTab("allGates")} className={`px-3 py-1 text-sm font-medium rounded-md transition ${checkInTab === "allGates" ? "bg-white/10 text-white" : "text-purple-200/60 hover:text-white"}`}>
                All ({allGateCheckIns.length})
              </button>
            </div>
          </div>

          <div className="p-4 max-h-80 overflow-y-auto">
            {(checkInTab === "thisGate" ? recentCheckIns : allGateCheckIns).length === 0 ? (
              <p className="text-center text-purple-200/40 py-8">No check-ins yet</p>
            ) : (
              <div className="space-y-2">
                {(checkInTab === "thisGate" ? recentCheckIns : allGateCheckIns).map((checkIn, index) => (
                  <div
                    key={`${checkIn.registrationId}-${checkIn.timestamp || index}`}
                    className={`p-4 rounded-xl border transition-all ${checkIn.isNew
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-white/5 border-white/10"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${checkIn.actionType === 'checkout' ? 'bg-orange-500/20' : 'bg-emerald-500/20'
                          }`}>
                          <span className={`text-lg ${checkIn.actionType === 'checkout' ? 'text-orange-400' : 'text-emerald-400'}`}>
                            {checkIn.actionType === 'checkout' ? '↑' : '↓'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{checkIn.guestName || "Guest"}</p>
                          <p className="text-xs text-purple-200/50">{checkIn.registrationType || 'General'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-bold rounded ${checkIn.actionType === 'checkout' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                          {checkIn.actionType === 'checkout' ? 'OUT' : 'IN'}
                        </span>
                        {checkIn.durationInside && <p className="text-xs text-orange-400 mt-1">{checkIn.durationInside}</p>}
                        <p className="text-xs text-purple-200/40 mt-1">{getRelativeTime(checkIn.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Duplicate Modal */}
      {duplicateInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-xl bg-slate-900/90 border border-amber-500/30 rounded-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Already Checked In</h2>
            </div>
            <div className="p-6">
              <p className="text-xl font-semibold text-white text-center mb-2">{duplicateInfo.guestName}</p>
              <p className="text-center text-amber-300/70 mb-4">
                Scanned at {duplicateInfo.checkInTime ? formatTime(duplicateInfo.checkInTime) : "earlier"}
                {duplicateInfo.gateName && ` at ${duplicateInfo.gateName}`}
              </p>
              <button onClick={() => setDuplicateInfo(null)} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showEndSessionDialog}
        title="End Session?"
        message="All data will be saved, but you won't be able to scan until you start a new session."
        confirmText="End Session"
        cancelText="Continue"
        variant="danger"
        onConfirm={confirmEndSession}
        onCancel={() => setShowEndSessionDialog(false)}
      />
    </div>
  );
}
