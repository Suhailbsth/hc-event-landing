"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { organizerApi, OrganizerEvent } from "@/lib/organizerApi";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function OrganizerEventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check if user came from a different event they're not assigned to
  const notAssignedTo = searchParams.get("notAssignedTo");
  useEffect(() => {
    // Check authentication
    if (!organizerApi.isAuthenticated()) {
      router.push("/organizer/login");
      return;
    }
    loadEvents();
  }, [router]);
  const loadEvents = async () => {
    try {
      const data = await organizerApi.getMyEvents();
      setEvents(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load events";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const handleEventSelect = (eventId: string) => {
    router.push(`/organizer/events/${eventId}/gates`);
  };
  const handleLogout = () => {
    organizerApi.logout();
    router.push("/organizer/login");
  };
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Same day event
    if (start.toDateString() === end.toDateString()) {
      return formatDate(startDate);
    }
    // Multi-day event
    const startMonth = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${startMonth} - ${endMonth}`;
  };
  // Generate a gradient fallback based on event colors or default
  const getBackgroundStyle = (event: OrganizerEvent) => {
    if (event.backgroundImageUrl) {
      return {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${event.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    // Use event colors if available, otherwise default gradient
    const primary = event.primaryColor || "#4F46E5";
    const secondary = event.secondaryColor || "#7C3AED";
    return {
      background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
    };
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Events</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Select an event to manage check-ins
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {notAssignedTo && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  You&apos;re not assigned to &quot;{notAssignedTo}&quot;
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Please select from your assigned events below, or contact your administrator.
                </p>
              </div>
            </div>
          </div>
        )}
        {events.length === 0 ? (
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events assigned</h3>
            <p className="mt-1 text-sm text-gray-500">
              Contact your administrator to be assigned to events.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.eventId}
                onClick={() => handleEventSelect(event.eventId)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
              >
                {/* Hero Section with Event Title */}
                <div
                  className="relative h-36 sm:h-40 flex flex-col justify-end p-4"
                  style={getBackgroundStyle(event)}
                >
                  {/* Event Logo (if available) */}
                  {event.logoUrl && (
                    <div className="absolute top-3 right-3">
                      <img
                        src={event.logoUrl}
                        alt="Event logo"
                        className="h-10 w-10 object-contain bg-white/90 rounded-lg p-1"
                      />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${event.status.toLowerCase() === "active"
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-700"
                        }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  {/* Event Title - PROMINENT */}
                  <div className="relative z-10">
                    {event.location && (
                      <div className="flex items-center text-white/80 text-xs mb-1">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
                      {event.eventTitle}
                    </h3>
                  </div>
                </div>
                {/* Event Details Section */}
                <div className="p-4">
                  <div className="space-y-2.5">
                    {/* Date */}
                    <div className="flex items-center text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 mr-2.5 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">{formatDateRange(event.startDate, event.endDate)}</span>
                    </div>
                    {/* Gates Count */}
                    <div className="flex items-center text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 mr-2.5 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      <span>
                        {event.gates?.length || 0} Gate{(event.gates?.length || 0) !== 1 ? "s" : ""} available
                      </span>
                    </div>
                  </div>
                </div>
                {/* Action Footer */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-indigo-600 font-semibold">Select gate to start</span>
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function OrganizerEventsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrganizerEventsContent />
    </Suspense>
  );
}