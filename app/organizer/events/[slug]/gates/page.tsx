"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { organizerApi, OrganizerEvent, DetailedEventGate } from "@/lib/organizerApi";
import {
  ArrowLeft,
  LogIn,
  LogOut,
  ArrowRightLeft,
  Loader2,
  AlertCircle,
  MapPin,
  Users,
  Building2
} from "lucide-react";

export default function GateSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.slug as string;

  const [event, setEvent] = useState<OrganizerEvent | null>(null);
  const [gates, setGates] = useState<DetailedEventGate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (!organizerApi.isAuthenticated()) {
      router.push("/organizer/login");
      return;
    }
    loadEvent();
  }, [eventId, router]);

  const loadEvent = async () => {
    try {
      const events = await organizerApi.getMyEvents();
      const selectedEvent = events.find((e) => e.eventId === eventId);

      if (!selectedEvent) {
        setError("Event not found or you don't have access");
        return;
      }

      setEvent(selectedEvent);
      const detailedGates = await organizerApi.getDetailedGatesForEvent(eventId);
      setGates(detailedGates);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load event details";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGateSelect = async (gateId: string) => {
    setStarting(gateId);
    setError("");

    try {
      await organizerApi.startGateSession(eventId, gateId);
      localStorage.setItem("activeEventId", eventId);
      router.push("/organizer/scanner");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start session";
      setError(errorMessage);
    } finally {
      setStarting(null);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getGateTypeConfig = (gateType: string) => {
    switch (gateType?.toLowerCase()) {
      case 'entry':
        return {
          icon: <LogIn className="w-5 h-5" />,
          bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          label: 'Entry Only'
        };
      case 'exit':
        return {
          icon: <LogOut className="w-5 h-5" />,
          bgColor: 'bg-amber-50 text-amber-600 border-amber-100',
          label: 'Exit Only'
        };
      default:
        return {
          icon: <ArrowRightLeft className="w-5 h-5" />,
          bgColor: 'bg-indigo-50 text-indigo-600 border-indigo-100',
          label: 'Entry & Exit'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9fa]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-zinc-400 animate-spin mx-auto" />
          <p className="mt-4 text-zinc-500 text-sm font-medium font-serif italic">Loading gates...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9fa] p-4">
        <div className="text-center bg-white border border-zinc-200 rounded-2xl p-8 shadow-glass-sm max-w-sm w-full">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-zinc-800 font-medium mb-4">{error || "Event not found"}</p>
          <button
            onClick={handleBack}
            className="w-full px-6 py-3 bg-zinc-900 text-white rounded-xl hover:bg-black transition-colors text-sm font-medium"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9fa] text-zinc-900 font-sans selection:bg-zinc-200 selection:text-black">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-luxury-gradient z-0 pointer-events-none opacity-60" />

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/70 border-b border-white/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center gap-3 sm:gap-4">
          <button
            onClick={handleBack}
            className="p-1.5 sm:p-2 text-zinc-400 hover:text-black hover:bg-black/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="min-w-0">
            <h1 dir="auto" className="text-lg sm:text-xl font-serif font-medium text-zinc-900 tracking-tight dynamic-content truncate">{event.eventTitle}</h1>
            <p className="text-[10px] sm:text-xs text-zinc-500 font-light truncate">Select a gate to start scanning</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!gates || gates.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full shadow-glass-md flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-300" />
            </div>
            <h3 className="text-xl sm:text-2xl font-serif text-zinc-900 mb-2">No Gates Configured</h3>
            <p className="text-zinc-500 font-light text-sm max-w-md mx-auto px-4">
              This event doesn't have any gates set up yet. Contact your administrator.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gates.map((gate: DetailedEventGate) => {
              const typeConfig = getGateTypeConfig(gate.gateType);

              return (
                <div key={gate.gateId} className={`group relative bg-white rounded-2xl p-5 sm:p-6 border border-zinc-100 hover:border-black transition-all hover:shadow-xl hover:-translate-y-1 ${!gate.isActive ? "opacity-60 grayscale" : ""}`}>
                  <div className={`p-2.5 sm:p-3 rounded-xl bg-zinc-50 w-fit mb-4 sm:mb-6 group-hover:bg-zinc-100 transition-colors px-4`}>
                    {typeConfig.icon}
                  </div>
                  <div>
                    <h3 dir="auto" className="text-base sm:text-lg font-serif font-medium text-zinc-900 dynamic-content">{gate.gateName}</h3>
                    <span className="text-[10px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wide">{typeConfig.label}</span>
                  </div>

                  {/* Gate Details */}
                  <div className="space-y-4 mb-6 sm:mb-8 mt-4 sm:mt-6">
                    <div dir="auto" className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-500 dynamic-content">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 shrink-0 mt-0.5" />
                      <span className="font-light">{gate.location || 'Location not set'}</span>
                    </div>

                    {/* Capacity Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-1.5 uppercase tracking-wider font-medium">
                        <span>Capacity</span>
                        <span>{gate.capacity || '∞'}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-900 rounded-full w-[30%]" />
                      </div>
                    </div>
                  </div>

                  {/* Current Organizer */}
                  {gate.currentOrganizer && (
                    <div className="mb-6 p-3 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-600 shrink-0">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-zinc-400 font-semibold">Assigned to</p>
                        <p dir="auto" className="text-xs text-zinc-700 font-medium truncate">{gate.currentOrganizer}</p>
                      </div>
                    </div>
                  )}

                  {/* Select Button */}
                  <button
                    onClick={() => handleGateSelect(gate.gateId)}
                    disabled={!gate.isActive || starting === gate.gateId}
                    className={`w-full py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${starting === gate.gateId
                        ? "bg-zinc-100 text-zinc-400 cursor-wait"
                        : "bg-zinc-900 text-white hover:bg-black shadow-lg shadow-zinc-200 hover:shadow-xl"
                      } disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed`}
                  >
                    {starting === gate.gateId ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Starting Session...</span>
                      </span>
                    ) : (
                      "Start Scanning"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
