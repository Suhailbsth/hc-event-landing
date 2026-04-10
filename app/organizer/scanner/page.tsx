"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { organizerApi, GateSession, AttendeeCheckIn, CheckInStats } from "@/lib/organizerApi";
import QRScanner from "@/components/QRScanner";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  ArrowLeft,
  Camera,
  Upload,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X
} from "lucide-react";

export default function ScannerPage() {
  const router = useRouter();
  const [session, setSession] = useState<GateSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [latestScan, setLatestScan] = useState<AttendeeCheckIn | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<AttendeeCheckIn[]>([]);
  const [allGateCheckIns, setAllGateCheckIns] = useState<AttendeeCheckIn[]>([]);
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [statistics, setStatistics] = useState<CheckInStats | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<AttendeeCheckIn | null>(null);
  const [selectedCheckIn, setSelectedCheckIn] = useState<AttendeeCheckIn | null>(null);
  const [checkInTab, setCheckInTab] = useState<"thisGate" | "allGates">("thisGate");
  const [searchQuery, setSearchQuery] = useState("");
  const [passFilter, setPassFilter] = useState<"all" | "speaker" | "exhibitor" | "vip" | "regular">("all");
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const scanInProgressRef = useRef(false);
  const lastScanRef = useRef<{ code: string; timestamp: number } | null>(null);
  const SCAN_DEDUPE_WINDOW_MS = 1200;

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
    } catch (error) {
      console.error("Failed to load recent check-ins:", error);
    }
  };

  const handleCheckIn = async (code: string) => {
    const normalizedCode = code.trim();
    if (!normalizedCode) return;

    const now = Date.now();
    if (scanInProgressRef.current) return;

    if (
      lastScanRef.current &&
      lastScanRef.current.code === normalizedCode &&
      now - lastScanRef.current.timestamp < SCAN_DEDUPE_WINDOW_MS
    ) {
      return;
    }

    scanInProgressRef.current = true;
    lastScanRef.current = { code: normalizedCode, timestamp: now };

    // Stop camera immediately to prevent repeat decode callbacks while processing.
    setCameraActive(false);

    setScanning(true);
    setError("");
    setLatestScan(null);
    setDuplicateInfo(null);

    try {
      const checkIn = await organizerApi.checkInAttendee(normalizedCode, session?.gateType);

      if (checkIn.isDuplicate) {
        if (checkIn.invalidReason === 'grace_period') {
          setError("⚠️ Just Scanned (Grace Period)");
          if (navigator.vibrate) navigator.vibrate(100);
        } else {
          setDuplicateInfo(checkIn);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
      } else {
        const newCheckIn = {
          ...checkIn,
          timestamp: new Date().toISOString(),
          isNew: true,
        };

        setRecentCheckIns(prev => [newCheckIn, ...prev].slice(0, 10));
        setAllGateCheckIns(prev => [newCheckIn, ...prev].slice(0, 20));
        setLatestScan(newCheckIn);

        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        if (session) {
          setSession({ ...session, checkInCount: session.checkInCount + 1 });
        }

        setTimeout(() => {
          setRecentCheckIns(prev => prev.map(item => ({ ...item, isNew: false })));
          setAllGateCheckIns(prev => prev.map(item => ({ ...item, isNew: false })));
        }, 2000);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : "Check-in failed";
      setError(message);
      if (navigator.vibrate) navigator.vibrate(500);
    } finally {
      setScanning(false);
      scanInProgressRef.current = false;
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
    const diffSec = Math.floor((now.getTime() - checkInTime.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getScanTimestamp = (checkIn: AttendeeCheckIn) => checkIn.timestamp || checkIn.checkInTime;

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "Unknown";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toLabelCase = (value?: string) => {
    if (!value) return "N/A";
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  const getAttendeeCategory = (registrationType?: string) => {
    const normalized = (registrationType || "").toLowerCase();

    if (normalized.includes("vip")) {
      return "VIP";
    }
    if (normalized.includes("speaker") || normalized.includes("keynote")) {
      return "Speaker";
    }
    if (normalized.includes("exhibitor")) {
      return "Exhibitor";
    }

    return "Regular Attendee";
  };

  const parseDurationToMs = (duration?: string) => {
    if (!duration) return null;

    const hours = Number((duration.match(/(\d+)\s*h/i) || [])[1] || 0);
    const minutes = Number((duration.match(/(\d+)\s*m/i) || [])[1] || 0);
    const seconds = Number((duration.match(/(\d+)\s*s/i) || [])[1] || 0);

    if (!hours && !minutes && !seconds) return null;

    return ((hours * 60 * 60) + (minutes * 60) + seconds) * 1000;
  };

  const getEntryTimeText = (checkIn: AttendeeCheckIn) => {
    const scanTimestamp = getScanTimestamp(checkIn);
    const scanDate = new Date(scanTimestamp);

    if (Number.isNaN(scanDate.getTime())) {
      return "Unknown";
    }

    if (checkIn.actionType === "checkout" && checkIn.durationInside) {
      const durationMs = parseDurationToMs(checkIn.durationInside);
      if (durationMs !== null) {
        return formatDateTime(new Date(scanDate.getTime() - durationMs).toISOString());
      }
    }

    return formatDateTime(scanTimestamp);
  };

  const getLocationText = (checkIn: AttendeeCheckIn) => {
    if (checkIn.gateName && checkIn.zoneName) {
      return `${checkIn.gateName} • ${checkIn.zoneName}`;
    }
    return checkIn.gateName || checkIn.zoneName || "Unknown";
  };

  const activeCheckIns = checkInTab === "thisGate" ? recentCheckIns : allGateCheckIns;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredCheckIns = activeCheckIns.filter(checkIn => {
    const category = getAttendeeCategory(checkIn.registrationType).toLowerCase();
    const categoryMatch =
      passFilter === "all" ||
      (passFilter === "speaker" && category === "speaker") ||
      (passFilter === "exhibitor" && category === "exhibitor") ||
      (passFilter === "vip" && category === "vip") ||
      (passFilter === "regular" && category === "regular attendee");

    if (!categoryMatch) return false;
    if (!normalizedSearch) return true;

    const guestName = (checkIn.guestName || "").toLowerCase();
    const guestEmail = (checkIn.guestEmail || "").toLowerCase();
    const registrationId = (checkIn.registrationId || "").toLowerCase();

    return (
      guestName.includes(normalizedSearch) ||
      guestEmail.includes(normalizedSearch) ||
      registrationId.includes(normalizedSearch)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9fa]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-zinc-200 rounded-full animate-spin border-t-zinc-900 mx-auto"></div>
          <p className="mt-6 text-zinc-500 font-medium font-serif italic">Initializing Scanner...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#f9f9fa] text-zinc-900 font-sans selection:bg-black/10 selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-200 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-serif font-bold text-zinc-900 leading-none">{session.gateName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${session.gateType === 'entry' ? 'bg-emerald-100 text-emerald-700' :
                    session.gateType === 'exit' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                  {session.gateType}
                </span>
                <span className="text-xs text-zinc-400 font-medium">{getSessionDuration()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleEndSession}
            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="End Session"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-zinc-100">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-around">
          <div className="text-center">
            <p className="text-3xl font-serif font-medium text-zinc-900">{session.checkInCount}</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Total Scans</p>
          </div>
          <div className="w-px h-10 bg-zinc-100"></div>
          <div className="text-center">
            <p className="text-3xl font-serif font-medium text-zinc-900">{session.isActive ? "Online" : "Offline"}</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Status</p>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* Scanner Card */}
        <div className="bg-white rounded-2xl shadow-glass-md border border-zinc-100 p-6">
          <div className="relative mb-6 min-h-[144px]">
            <div className={`text-center transition-opacity duration-150 ${latestScan ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-zinc-50 ${cameraActive ? 'animate-pulse ring-4 ring-zinc-100' : ''}`}>
                <Camera className="w-8 h-8 text-zinc-400" />
              </div>
              <h2 className="text-lg font-medium text-zinc-900">Scan Ticket</h2>
              <p className="text-sm text-zinc-400">Point camera at QR code</p>
            </div>

            {latestScan && (
              <div className={`absolute inset-0 p-4 rounded-xl border shadow-sm animate-in slide-in-from-top-2 ${latestScan.actionType === 'checkout' ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'
                }`}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className={`w-5 h-5 mt-0.5 ${latestScan.actionType === 'checkout' ? 'text-amber-600' : 'text-green-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold truncate ${latestScan.actionType === 'checkout' ? 'text-amber-900' : 'text-green-900'}`}>
                        {latestScan.guestName || "Attendee"}
                      </p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${latestScan.actionType === 'checkout' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {latestScan.actionType === 'checkout' ? 'OUT' : 'IN'}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <p className={latestScan.actionType === 'checkout' ? 'text-amber-700' : 'text-green-700'}>
                        <span className="font-semibold">Pass:</span> {getAttendeeCategory(latestScan.registrationType)}
                      </p>
                      <p className={latestScan.actionType === 'checkout' ? 'text-amber-700' : 'text-green-700'}>
                        <span className="font-semibold">Entry:</span> {getEntryTimeText(latestScan)}
                      </p>
                    </div>

                    <button
                      onClick={() => setLatestScan(null)}
                      className={`mt-3 w-full py-2 rounded-lg text-sm font-semibold transition-colors ${latestScan.actionType === 'checkout' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setCameraActive(!cameraActive)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${cameraActive
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-zinc-900 text-white hover:bg-black shadow-lg shadow-zinc-200"
                }`}
            >
              <Camera className="w-4 h-4" />
              {cameraActive ? "Stop" : "Camera"}
            </button>
            <label className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-zinc-50 text-zinc-700 hover:bg-zinc-100 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              Upload
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
                  html5QrCode.clear();
                } catch (err) {
                  setError("Could not read QR code from image");
                } finally {
                  setScanning(false);
                }
              }} />
            </label>
          </div>

          <div id="qr-file-reader" className="hidden"></div>

          {cameraActive && (
            <div className="rounded-xl overflow-hidden border-2 border-zinc-100">
              <QRScanner onScan={handleCheckIn} onError={setError} isActive={cameraActive} />
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-serif font-medium text-zinc-900">Recent Activity</h3>
            <div className="flex bg-zinc-100 rounded-lg p-0.5">
              <button
                onClick={() => setCheckInTab("thisGate")}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${checkInTab === "thisGate" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
              >
                Local
              </button>
              <button
                onClick={() => setCheckInTab("allGates")}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${checkInTab === "allGates" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
              >
                Global
              </button>
            </div>
          </div>

          <div className="mb-4 space-y-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or ID"
              className="w-full px-3 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All" },
                { key: "speaker", label: "Speaker" },
                { key: "exhibitor", label: "Exhibitor" },
                { key: "vip", label: "VIP" },
                { key: "regular", label: "Regular" },
              ].map(filter => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setPassFilter(filter.key as "all" | "speaker" | "exhibitor" | "vip" | "regular")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${passFilter === filter.key
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {activeCheckIns.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-zinc-100 border-dashed">
                <Clock className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">No activity yet</p>
              </div>
            ) : filteredCheckIns.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-zinc-100 border-dashed">
                <Clock className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">No attendees match your search/filter</p>
              </div>
            ) : (
              filteredCheckIns.map((checkIn, index) => (
                <button
                  type="button"
                  onClick={() => setSelectedCheckIn(checkIn)}
                  key={`${checkIn.registrationId}-${index}`}
                  className={`w-full p-4 bg-white rounded-xl border transition-all text-left ${checkIn.isNew ? "border-green-200 bg-green-50" : "border-zinc-100"
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900 text-sm">{checkIn.guestName || "Guest"}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${checkIn.actionType === 'checkout' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                          }`}>
                          {checkIn.actionType === 'checkout' ? 'OUT' : 'IN'}
                        </span>
                        {checkInTab === 'allGates' && checkIn.gateName && (
                          <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                            {checkIn.gateName}
                          </span>
                        )}
                        <span className="text-xs text-zinc-400">{getRelativeTime(checkIn.timestamp)}</span>
                      </div>
                    </div>
                    {checkIn.actionType === 'checkout' && checkIn.durationInside && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg whitespace-nowrap ml-2">
                        {checkIn.durationInside} inside
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </main>

      {selectedCheckIn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCheckIn(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-100 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">{selectedCheckIn.guestName || "Guest"}</h3>
                <p className="text-xs text-zinc-500 mt-1">{getAttendeeCategory(selectedCheckIn.registrationType)}</p>
              </div>
              <button
                onClick={() => setSelectedCheckIn(null)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">Action</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${selectedCheckIn.actionType === 'checkout' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {selectedCheckIn.actionType === 'checkout' ? 'OUT' : 'IN'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-zinc-500">Email</span>
                <span className="text-zinc-900 text-right break-all">{selectedCheckIn.guestEmail || "N/A"}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-zinc-500">Gate / Zone</span>
                <span className="text-zinc-900 text-right">{getLocationText(selectedCheckIn)}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-zinc-500">Scanned At</span>
                <span className="text-zinc-900 text-right">{formatDateTime(getScanTimestamp(selectedCheckIn))}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-zinc-500">Entry Time</span>
                <span className="text-zinc-900 text-right">{getEntryTimeText(selectedCheckIn)}</span>
              </div>
              {selectedCheckIn.durationInside && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-zinc-500">Duration</span>
                  <span className="text-zinc-900 text-right">{selectedCheckIn.durationInside}</span>
                </div>
              )}
              {selectedCheckIn.scannerUserName && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-zinc-500">Scanner</span>
                  <span className="text-zinc-900 text-right">{selectedCheckIn.scannerUserName}</span>
                </div>
              )}
              {selectedCheckIn.invalidReason && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-zinc-500">Reason</span>
                  <span className="text-zinc-900 text-right">{toLabelCase(selectedCheckIn.invalidReason)}</span>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-zinc-100">
              <button
                onClick={() => setSelectedCheckIn(null)}
                className="w-full py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Overlay */}
      {duplicateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-amber-500 p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-white mx-auto mb-2" />
              <h3 className="text-xl font-serif font-bold text-white">Already Checked In</h3>
            </div>
            <div className="p-6">
              <p className="text-center font-medium text-zinc-900 text-lg mb-1">{duplicateInfo.guestName}</p>
              <p className="text-center text-zinc-500 text-sm mb-6">
                Scanned at {duplicateInfo.checkInTime ? formatTime(duplicateInfo.checkInTime) : "earlier"}
                {duplicateInfo.gateName && ` at ${duplicateInfo.gateName}`}
              </p>
              <button
                onClick={() => setDuplicateInfo(null)}
                className="w-full py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-black transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showEndSessionDialog}
        title="End Session?"
        message="Are you sure you want to stop scanning? You can resume later."
        confirmText="End Session"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmEndSession}
        onCancel={() => setShowEndSessionDialog(false)}
      />
    </div>
  );
}
