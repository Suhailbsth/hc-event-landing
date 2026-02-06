"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { organizerApi, OrganizerEvent, DetailedEventGate } from "@/lib/organizerApi";

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
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          ),
          color: 'from-emerald-500 to-green-600',
          bgColor: 'bg-emerald-500/20',
          textColor: 'text-emerald-400',
          label: 'Entry Only'
        };
      case 'exit':
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ),
          color: 'from-orange-500 to-red-600',
          bgColor: 'bg-orange-500/20',
          textColor: 'text-orange-400',
          label: 'Exit Only'
        };
      default:
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          ),
          color: 'from-purple-500 to-indigo-600',
          bgColor: 'bg-purple-500/20',
          textColor: 'text-purple-400',
          label: 'Entry & Exit'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full animate-spin border-t-purple-500"></div>
          </div>
          <p className="mt-6 text-purple-200 font-medium">Loading gates...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-300 mb-4">{error || "Event not found"}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-3 text-purple-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{event.eventTitle}</h1>
              <p className="text-purple-200/70 mt-1">Select a gate to start scanning</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {!gates || gates.length === 0 ? (
          <div className="text-center py-16">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Gates Configured</h3>
              <p className="text-purple-200/60">Contact your administrator to set up gates for this event.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gates.map((gate: DetailedEventGate) => {
              const typeConfig = getGateTypeConfig(gate.gateType);

              return (
                <div
                  key={gate.gateId}
                  className={`group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 ${!gate.isActive ? "opacity-50" : ""
                    }`}
                >
                  {/* Gradient accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${typeConfig.color}`}></div>

                  <div className="p-6">
                    {/* Gate Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${typeConfig.bgColor} rounded-xl flex items-center justify-center ${typeConfig.textColor}`}>
                          {typeConfig.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{gate.gateName}</h3>
                          <span className={`text-xs font-medium ${typeConfig.textColor}`}>{typeConfig.label}</span>
                        </div>
                      </div>
                      {gate.isActive ? (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-semibold rounded-full border border-gray-500/30">
                          Inactive
                        </span>
                      )}
                    </div>

                    {/* Gate Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm text-purple-200/70">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{gate.location || 'Location not set'}</span>
                      </div>

                      {/* Capacity Bar */}
                      <div>
                        <div className="flex justify-between text-xs text-purple-200/50 mb-1">
                          <span>Capacity</span>
                          <span>{gate.capacity || '∞'}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${typeConfig.color} rounded-full`} style={{ width: '30%' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Current Organizer */}
                    {gate.currentOrganizer && (
                      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-blue-300/70">Currently assigned</p>
                            <p className="text-sm text-blue-200 font-medium">{gate.currentOrganizer}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Select Button */}
                    <button
                      onClick={() => handleGateSelect(gate.gateId)}
                      disabled={!gate.isActive || starting === gate.gateId}
                      className={`w-full relative overflow-hidden rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${starting === gate.gateId ? '' : 'group-hover:shadow-lg group-hover:shadow-purple-500/20'
                        }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${typeConfig.color}`}></div>
                      <span className="relative flex items-center justify-center py-3 px-4 text-white">
                        {starting === gate.gateId ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Starting...
                          </>
                        ) : (
                          <>
                            Start Scanning
                            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
