"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { organizerApi, OrganizerEvent } from "@/lib/organizerApi";
import {
  Calendar,
  MapPin,
  DoorOpen,
  ChevronRight,
  LogOut,
  ArrowLeft,
  Loader2,
  AlertCircle
} from "lucide-react";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-zinc-400 animate-spin mx-auto" />
        <p className="mt-4 text-zinc-500 text-sm font-medium">Loading events...</p>
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

  const getBackgroundStyle = (event: OrganizerEvent) => {
    if (event.backgroundImageUrl) {
      return {
        backgroundImage: `linear-gradient(to bottom, rgba(9,9,11,0.2), rgba(9,9,11,0.9)), url(${event.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    // Minimal dark gradient fallback
    return {
      background: `linear-gradient(135deg, #18181b 0%, #27272a 100%)`, // zinc-900 to zinc-800
    };
  };

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-zinc-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">My Events</h1>
              <p className="text-xs text-zinc-500 hidden sm:block">
                Select an event to manage
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Warning State */}
        {notAssignedTo && (
          <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-500">
                Access Restricted
              </p>
              <p className="text-sm text-amber-400/80 mt-1">
                You are not assigned to &quot;{notAssignedTo}&quot;. Please select from your assigned events below.
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-medium text-zinc-200">No events assigned</h3>
            <p className="mt-2 text-sm text-zinc-500 max-w-sm">
              You haven't been assigned to any events yet. Contact your administrator for access.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.eventId}
                onClick={() => handleEventSelect(event.eventId)}
                className="group relative bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1"
              >
                {/* Hero / Background Area */}
                <div
                  className="relative h-48 flex flex-col justify-end p-6 transition-transform duration-700 group-hover:scale-105"
                  style={getBackgroundStyle(event)}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

                  {/* Content Overlay */}
                  <div className="relative z-10">
                    {/* Status Badge */}
                    <div className="absolute top-0 right-0 -mt-40">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${event.status.toLowerCase() === "active"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        }`}>
                        {event.status}
                      </span>
                    </div>

                    {/* Logo */}
                    {event.logoUrl && (
                      <img
                        src={event.logoUrl}
                        alt="Logo"
                        className="w-12 h-12 object-contain bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-1.5 mb-3"
                      />
                    )}

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white leading-tight mb-2 group-hover:text-white/90 transition-colors">
                      {event.eventTitle}
                    </h3>

                    {/* Location */}
                    {event.location && (
                      <div className="flex items-center text-zinc-400 text-xs">
                        <MapPin className="w-3.5 h-3.5 mr-1.5" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-6 bg-zinc-950/50 backdrop-blur-sm border-t border-white/5 space-y-4">
                  <div className="space-y-3">
                    {/* Date */}
                    <div className="flex items-start text-sm text-zinc-400">
                      <Calendar className="w-4 h-4 mr-3 mt-0.5 text-zinc-500" />
                      <div>
                        <p className="text-zinc-300 font-medium">Date</p>
                        <span>{formatDateRange(event.startDate, event.endDate)}</span>
                      </div>
                    </div>

                    {/* Gates */}
                    <div className="flex items-start text-sm text-zinc-400">
                      <DoorOpen className="w-4 h-4 mr-3 mt-0.5 text-zinc-500" />
                      <div>
                        <p className="text-zinc-300 font-medium">Gates</p>
                        <span>{event.gates?.length || 0} Available</span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-4 flex items-center justify-between text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                    <span>Select Gate</span>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
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