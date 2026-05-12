"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { organizerApi, GateSession, AttendeeCheckIn, CheckInStats } from "@/lib/organizerApi";
import { scannerCache, ScannerCache } from "@/lib/scannerCache";
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
  X,
  Search,
  Users,
  ChevronDown
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

  // Marriage event detection
  const isMarriageEvent = session?.eventTitle?.toLowerCase().includes("marriage") || 
                          session?.eventTitle?.toLowerCase().includes("wedding") ||
                          session?.eventTitle?.toLowerCase().includes("nikkah") ||
                          session?.eventTitle?.toLowerCase().includes("wedding"); // Double check

  // Helper to get friendly pass type
  const getFriendlyPassType = (type: string) => {
    const t = type?.toLowerCase();
    if (t === 'regular' || t === 'attendee') return isMarriageEvent ? 'Guest' : 'Regular Attendee';
    if (t === 'vip') return isMarriageEvent ? 'VIP Guest' : 'VIP';
    return type;
  };

  // Offline cache status
  const [cacheStatus, setCacheStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [cacheCount, setCacheCount] = useState(0);

  const hapticFeedback = (duration: number | number[]) => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

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
      console.log("[Scanner] Session Loaded:", { 
        title: session.eventTitle, 
        isMarriage: isMarriageEvent,
        gate: session.gateName 
      });
      loadStatistics();
      loadRecentCheckIns();
    }
  }, [session?.eventId, session?.gateId]); // Only reload if event or gate changes, not on count updates

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

      // Preload visitor cache in background right after session loads
      const token = localStorage.getItem("organizerToken") || "";
      setCacheStatus("loading");
      scannerCache.preload(eventId, token)
        .then((count) => {
          setCacheCount(count);
          setCacheStatus("ready");
        })
        .catch((err) => {
          console.error("[ScannerCache] Preload failed:", err);
          setCacheStatus("error");
        });
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

    setCameraActive(false);
    setScanning(true);
    setError("");
    setLatestScan(null);
    setDuplicateInfo(null);

    try {
      const startTime = performance.now();
      let checkIn: AttendeeCheckIn;

      // ── Fast path: compact tiny QR OR Raw GUID via local cache ─────────
      const isFastPath = (ScannerCache.isTinyFormat(normalizedCode) || ScannerCache.isRawGuid(normalizedCode));
      if (isFastPath && scannerCache.isLoaded() && session) {
        console.log(`[Scanner] Processing TinyFormat QR: ${normalizedCode}`);
        checkIn = await organizerApi.checkInFast(normalizedCode, session, scannerCache);
      } else {
        // ── Legacy path: full JWT-URL (old passes) ──────────────────────────
        console.log(`[Scanner] Processing Legacy QR`);
        checkIn = await organizerApi.checkInAttendee(normalizedCode, session?.gateType);
      }

      const processingTime = performance.now() - startTime;
      console.log(`[Scanner] Scan-to-Result logic complete in ${processingTime.toFixed(2)}ms`);

      // ── Update local states ──────────────────────────────────────────
      // Every scan should appear in the list immediately, even duplicates or check-outs
      const newCheckIn = {
        ...checkIn,
        timestamp: new Date().toISOString(),
        isNew: true,
      };

      if (checkIn.isDuplicate) {
        if (checkIn.invalidReason === 'grace_period') {
          setError("⚠️ Just Scanned (Grace Period)");
          hapticFeedback(100);
        } else {
          setDuplicateInfo(newCheckIn);
          hapticFeedback([200, 100, 200]);
        }
      } else {
        hapticFeedback([100, 50, 100]);
        if (session) {
          setSession({ ...session, checkInCount: session.checkInCount + 1 });
        }
      }

      // Add to lists regardless of duplicate status so user sees the feedback
      setRecentCheckIns(prev => [newCheckIn, ...prev].slice(0, 50));
      setAllGateCheckIns(prev => [newCheckIn, ...prev].slice(0, 100));
      setLatestScan(newCheckIn);

      const totalTime = performance.now() - startTime;
      console.log(`[Scanner] UI total update time: ${totalTime.toFixed(2)}ms`);

      setTimeout(() => {
        setRecentCheckIns(prev => prev.map(item => ({ ...item, isNew: false })));
        setAllGateCheckIns(prev => prev.map(item => ({ ...item, isNew: false })));
      }, 2000);

    } catch (error) {
      const message = error instanceof Error ? error.message : "Check-in failed";
      setError(message);
      hapticFeedback(500);
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
      return isMarriageEvent ? "VIP Guest" : "VIP";
    }
    if (normalized.includes("speaker") || normalized.includes("keynote")) {
      return "Speaker";
    }
    if (normalized.includes("exhibitor")) {
      return "Exhibitor";
    }

    return isMarriageEvent ? "Guest" : "Regular Attendee";
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
          <p className="mt-6 text-zinc-500 font-medium font-serif italic text-sm">Initializing Scanner...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#f9f9fa] text-zinc-900 font-sans selection:bg-black/10 selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-200 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-2 sm:py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => router.back()} className="p-1.5 sm:p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0">
              <h1 dir="auto" className="text-base sm:text-lg font-serif font-bold text-zinc-900 leading-none dynamic-content truncate">{session.gateName}</h1>
              <div className="flex items-center gap-2 mt-1 whitespace-nowrap overflow-hidden">
                <span className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase rounded-full shrink-0 ${session.gateType === 'entry' ? 'bg-emerald-100 text-emerald-700' :
                    session.gateType === 'exit' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                  {session.gateType}
                </span>
                <span className="text-[10px] sm:text-xs text-zinc-400 font-medium shrink-0">{getSessionDuration()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleEndSession}
            className="p-1.5 sm:p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors shrink-0"
            title="End Session"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-zinc-100">
        <div className="max-w-md mx-auto px-4 py-3 sm:py-4 flex justify-around">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900">{session.checkInCount}</p>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Total Scans</p>
          </div>
          <div className="w-px h-8 sm:h-10 bg-zinc-100"></div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-zinc-900">{session.isActive ? "Online" : "Offline"}</p>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Status</p>
          </div>
          <div className="w-px h-8 sm:h-10 bg-zinc-100"></div>
          {/* Offline Cache Status Badge */}
          <div className="text-center">
            {cacheStatus === "loading" && (
              <>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-amber-500">...</p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-amber-400 font-bold">Loading</p>
              </>
            )}
            {cacheStatus === "ready" && (
              <>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-emerald-600">{cacheCount}</p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-emerald-500 font-bold">Loaded ✓</p>
              </>
            )}
            {cacheStatus === "error" && (
              <>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-red-500">!</p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-red-400 font-bold">Cache Err</p>
              </>
            )}
            {cacheStatus === "idle" && (
              <>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-zinc-400">–</p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Cache</p>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-4 sm:py-6 space-y-6 sm:space-y-8 pb-20">
        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* Scanner Card */}
        <div className="bg-white rounded-2xl shadow-premium border border-zinc-100 p-4 sm:p-6 overflow-hidden">
          <div className="relative mb-6 flex items-center justify-between px-1">
             <div className="flex items-center gap-2">
                <Camera className={`w-4 h-4 sm:w-5 sm:h-5 ${cameraActive ? 'text-indigo-600' : 'text-zinc-400'}`} />
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">Scanner Portal</h2>
             </div>
             {cameraActive && (
               <div className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">Live</span>
               </div>
             )}
          </div>

          <div className="relative mb-4 min-h-[200px] sm:min-h-[240px]">
            {!cameraActive && !latestScan && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-50/50 rounded-2xl border-2 border-dashed border-zinc-200/60">
                <div className="w-12 h-12 bg-white rounded-full p-3 shadow-sm mb-3">
                   <Camera className="w-full h-full text-zinc-300" />
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium">Camera Is Inactive</p>
                <p className="text-[9px] sm:text-[10px] text-zinc-400 mt-1 uppercase tracking-widest font-bold">Press Start To Begin</p>
              </div>
            )}

            {latestScan && (
              <div className={`absolute inset-0 z-10 p-5 sm:p-6 rounded-2xl border flex flex-col justify-between overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 ${
                latestScan.actionType === 'checkout' ? 'bg-amber-50 border-amber-200 shadow-amber-200/20' : 'bg-emerald-50 border-emerald-200 shadow-emerald-200/20'
              }`}>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${latestScan.actionType === 'checkout' ? 'bg-amber-100 shadow-inner' : 'bg-emerald-100 shadow-inner'}`}>
                    <CheckCircle2 className={`w-5 h-5 sm:w-6 sm:h-6 ${latestScan.actionType === 'checkout' ? 'text-amber-600' : 'text-emerald-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p dir="auto" className={`text-base sm:text-lg font-bold truncate dynamic-content ${latestScan.actionType === 'checkout' ? 'text-amber-900' : 'text-emerald-900'}`}>
                        {latestScan.guestName || (isMarriageEvent ? "Guest" : "Attendee")}
                      </p>
                    </div>
                    
                    <div className="inline-flex items-center gap-1.5 mb-2">
                       <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${latestScan.actionType === 'checkout' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                          {latestScan.actionType === 'checkout' ? 'OUT' : 'IN'}
                       </span>
                        <span className={`text-[10px] font-bold uppercase ${latestScan.actionType === 'checkout' ? 'text-amber-700/60' : 'text-emerald-700/60'}`}>
                           {getAttendeeCategory(latestScan.registrationType)}
                        </span>
                        {latestScan.companions && latestScan.companions > 0 && (
                          <span className="text-[10px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded shadow-sm animate-pulse ml-1">
                            +{latestScan.companions} GUESTS
                          </span>
                        )}
                     </div>

                    <div className={`text-xs font-medium space-y-0.5 ${latestScan.actionType === 'checkout' ? 'text-amber-700/80' : 'text-emerald-700/80'}`}>
                        <div className="flex items-center gap-1.5 opacity-80">
                           <Clock className="w-3 h-3" />
                           <span>{getEntryTimeText(latestScan)}</span>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6">
                   <button
                    onClick={() => setLatestScan(null)}
                    className={`w-full py-4 sm:py-4.5 rounded-2xl text-sm sm:text-base font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-1 ${
                      latestScan.actionType === 'checkout' 
                        ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    Next Attendee
                    <ChevronDown className="w-4 h-4 opacity-70" />
                  </button>
                </div>
              </div>
            )}

            {cameraActive && (
              <div className="rounded-2xl overflow-hidden shadow-inner ring-1 ring-zinc-100 border-2 border-zinc-100">
                <QRScanner onScan={handleCheckIn} onError={setError} isActive={cameraActive} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={() => setCameraActive(!cameraActive)}
              className={`flex items-center justify-center gap-2 py-3.5 sm:py-4 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 ${cameraActive
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-zinc-900 text-white border border-zinc-900 shadow-xl"
                }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span className="truncate">{cameraActive ? "Stop Camera" : "Start Scanner"}</span>
            </button>
            <label className="flex items-center justify-center gap-2 py-3.5 sm:py-4 px-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 cursor-pointer shadow-sm transition-all active:scale-95 overflow-hidden">
              <Upload className="w-4 h-4 shrink-0" />
              <span className="truncate">Upload QR</span>
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
        </div>

        {/* Activity Feed */}
        <div className="pb-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-serif font-bold text-zinc-900 tracking-tight">Recent Activity</h3>
            <div className="flex bg-zinc-200/50 rounded-xl p-1">
              <button
                onClick={() => setCheckInTab("thisGate")}
                className={`px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase rounded-lg transition-all ${checkInTab === "thisGate" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
              >
                Local
              </button>
              <button
                onClick={() => setCheckInTab("allGates")}
                className={`px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase rounded-lg transition-all ${checkInTab === "allGates" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
              >
                Global
              </button>
            </div>
          </div>

          <div className="mb-4 space-y-3">
            <div className="relative group">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-black transition-colors" />
              <input
                type="text"
                placeholder="Search attendee by name..."
                className="w-full ps-10 pe-4 py-3 text-xs sm:text-sm bg-white border border-zinc-200 rounded-xl focus:ring-1 focus:ring-black focus:border-black placeholder-zinc-400 shadow-sm"
                value={searchQuery}
                dir="auto"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          {/* Filters REMOVED per user request */}
          </div>

          <div className="space-y-3">
            {activeCheckIns.length === 0 ? (
              <div className="text-center py-12 bg-zinc-50/50 rounded-2xl border border-zinc-200 border-dashed">
                <Clock className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">No activity yet</p>
              </div>
            ) : filteredCheckIns.length === 0 ? (
              <div className="text-center py-12 bg-zinc-50/50 rounded-2xl border border-zinc-200 border-dashed">
                <Clock className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">No attendees match your filter</p>
              </div>
            ) : (
              filteredCheckIns.map((checkIn, index) => (
                <button
                  type="button"
                  onClick={() => setSelectedCheckIn(checkIn)}
                  key={`${checkIn.registrationId}-${index}`}
                  className={`w-full p-4 bg-white rounded-2xl border transition-all text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${checkInTab === "thisGate" && checkIn.isNew ? "border-green-300 bg-green-50/50 shadow-green-100" : "border-zinc-100 hover:border-zinc-300"
                    }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p dir="auto" className="font-bold text-zinc-900 text-sm dynamic-content truncate uppercase tracking-tight">{checkIn.guestName || "Guest"}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm shadow-sm ${checkIn.actionType === 'checkout' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                          }`}>
                          {checkIn.actionType === 'checkout' ? 'OUT' : 'IN'}
                        </span>
                        {checkInTab === 'allGates' && checkIn.gateName && (
                          <span className="text-[9px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-sm border border-zinc-200 uppercase">
                            {checkIn.gateName}
                          </span>
                        )}
                          <span className="text-[10px] text-zinc-400 font-medium">{getRelativeTime(checkIn.timestamp)}</span>
                          {checkIn.companions && checkIn.companions > 0 && (
                            <span className="text-[10px] font-black text-white bg-indigo-600 px-2 py-0.5 rounded-full shadow-sm ml-auto">
                              {(checkIn.companions || 0) + 1} PEOPLE
                            </span>
                          )}
                      </div>
                    </div>
                    {checkIn.actionType === 'checkout' && checkIn.durationInside && (
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 whitespace-nowrap shrink-0">
                        {checkIn.durationInside}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm transition-all animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCheckIn(null);
            }
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100">
            <div className="p-6 border-b border-zinc-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 dir="auto" className="text-xl font-serif font-black text-zinc-900 dynamic-content break-words leading-tight uppercase tracking-tight">{selectedCheckIn.guestName || "Guest"}</h3>
                <div className="flex items-center gap-2 mt-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{getAttendeeCategory(selectedCheckIn.registrationType)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCheckIn(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-medium">
              <div className="flex items-center justify-between gap-3 p-3 bg-zinc-50 rounded-2xl">
                <span className="text-zinc-500">Session Status</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${selectedCheckIn.actionType === 'checkout' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}>
                  {selectedCheckIn.actionType === 'checkout' ? 'Outside' : 'Inside'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <p className="text-zinc-400 text-[9px] uppercase font-bold tracking-widest">Action</p>
                    <p className="text-zinc-900 font-bold uppercase">{selectedCheckIn.actionType === 'checkout' ? 'Check-out' : 'Check-in'}</p>
                 </div>
                 <div className="space-y-1 text-right">
                    <p className="text-zinc-400 text-[9px] uppercase font-bold tracking-widest">Time</p>
                    <p className="text-zinc-900 font-bold">{formatTime(getScanTimestamp(selectedCheckIn))}</p>
                 </div>
              </div>
              <div className="space-y-4 pt-2">
                 <div className="flex items-start justify-between gap-4">
                    <span className="text-zinc-500 shrink-0">Gate / Area</span>
                    <span className="text-zinc-900 text-right truncate">{getLocationText(selectedCheckIn)}</span>
                 </div>
                 <div className="flex items-start justify-between gap-4">
                    <span className="text-zinc-500 shrink-0">Duration</span>
                    <span className="text-zinc-900 text-right font-bold">{selectedCheckIn.durationInside || "N/A"}</span>
                 </div>
                 <div className="flex items-start justify-between gap-4">
                    <span className="text-zinc-500 shrink-0">Email</span>
                    <span className="text-zinc-900 text-right break-all">{selectedCheckIn.guestEmail || "N/A"}</span>
                 </div>
                 {selectedCheckIn.companions && selectedCheckIn.companions > 0 && (
                    <div className="flex items-start justify-between gap-4 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 mt-2">
                       <span className="text-indigo-600 font-bold shrink-0">Group Size</span>
                       <span className="text-indigo-700 font-black text-lg">{(selectedCheckIn.companions || 0) + 1} People</span>
                    </div>
                  )}
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100">
              <button
                onClick={() => setSelectedCheckIn(null)}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
              >
                Dismiss Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Overlay */}
      {duplicateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100">
            <div className="bg-amber-500 p-8 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/40">
                 <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h3 className="text-2xl font-serif font-black uppercase tracking-tight">Access Restricted</h3>
              <p className="text-sm font-bold opacity-80 mt-1 uppercase">Already Checked In</p>
            </div>
            <div className="p-8 text-center">
              <p dir="auto" className="text-lg font-black text-zinc-900 mb-1 uppercase tracking-tighter dynamic-content">{duplicateInfo.guestName}</p>
              <p className="text-xs font-bold text-zinc-400 mb-8 uppercase tracking-wide">
                 {duplicateInfo.gateName && `At ${duplicateInfo.gateName} • `}{formatTime(duplicateInfo.checkInTime || "")}
              </p>
              <button
                onClick={() => setDuplicateInfo(null)}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-zinc-200 shadow-xl active:scale-95"
              >
                Dismiss Warning
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showEndSessionDialog}
        title="End Session"
        message="Are you sure you want to stop scanning for this gate? You will be returned to the event dashboard."
        confirmText="Confirm End"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmEndSession}
        onCancel={() => setShowEndSessionDialog(false)}
      />
    </div>
  );
}
