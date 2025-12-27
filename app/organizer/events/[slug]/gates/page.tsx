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

      // Fetch detailed gates
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
      // Store eventId for scanner page
      localStorage.setItem("activeEventId", eventId);
      // Redirect to scanner page
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">{error || "Event not found"}</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={handleBack}
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
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <p className="text-sm text-gray-600 mt-1">Select a gate to start check-in</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {!gates || gates.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No gates configured</h3>
            <p className="mt-1 text-sm text-gray-500">
              Contact your administrator to set up gates for this event.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gates.map((gate: DetailedEventGate) => (
              <div
                key={gate.gateId}
                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden ${
                  !gate.isActive ? "opacity-60" : ""
                }`}
              >
                <div className="p-6">
                  {/* Gate Name */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{gate.name}</h3>
                    {gate.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Gate Details */}
                  <div className="mb-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Type:</span> {gate.type}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Location:</span> {gate.location}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Capacity:</span> {gate.capacity}
                    </p>
                  </div>

                  {/* Current Organizer Status */}
                  {gate.currentOrganizer && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <span className="font-medium">Currently assigned to:</span>
                        <br />
                        {gate.currentOrganizer}
                      </p>
                    </div>
                  )}

                  {/* Select Button */}
                  <button
                    onClick={() => handleGateSelect(gate.gateId)}
                    disabled={!gate.isActive || starting === gate.gateId}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {starting === gate.gateId ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                        Starting Session...
                      </span>
                    ) : (
                      "Select This Gate"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
