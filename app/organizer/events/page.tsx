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
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9fa]">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-zinc-400 animate-spin mx-auto" />
        <p className="mt-4 text-zinc-500 text-sm font-medium font-serif italic">Loading events...</p>
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

  const notAssignedTo = searchParams.get("notAssignedTo");

  useEffect(() => {
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

    if (start.toDateString() === end.toDateString()) {
      return formatDate(startDate);
    }

    const startMonth = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${startMonth} - ${endMonth}`;
  };

  const getBackgroundStyle = (event: OrganizerEvent) => {
    if (event.backgroundImageUrl) {
      return {
        backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.95)), url(${event.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    // Minimal Light Fallback
    return {
      background: `linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)`,
    };
  };

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-[#f9f9fa] text-zinc-900 selection:bg-zinc-200 selection:text-black font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-luxury-gradient z-0 pointer-events-none opacity-50" />

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/70 border-b border-white/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-zinc-400 hover:text-black hover:bg-black/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 dir="auto" className="text-xl font-serif font-medium text-zinc-900 tracking-tight">My Events</h1>
              <p className="text-xs text-zinc-500 hidden sm:block font-light">
                Select an event to manage
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-500 hover:text-red-600 bg-transparent hover:bg-red-50 rounded-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Warning State */}
        {notAssignedTo && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Access Restricted
              </p>
              <p className="text-sm text-amber-700/80 mt-1">
                You are not assigned to &quot;{notAssignedTo}&quot;. Please select from your assigned events below.
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-white shadow-glass-md flex items-center justify-center mb-6">
              <Calendar className="w-8 h-8 text-zinc-300" />
            </div>
            <h3 className="text-2xl font-serif text-zinc-900 mb-2">No events assigned</h3>
            <p className="text-zinc-500 max-w-sm font-light">
              You haven't been assigned to any events yet. Contact your administrator for access.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.eventId}
                onClick={() => handleEventSelect(event.eventId)}
                className="group relative bg-white border border-zinc-100 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-glass-md hover:-translate-y-1"
              >
                {/* Hero / Background Area */}
                <div
                  className="relative h-56 flex flex-col justify-end p-8 transition-transform duration-700 group-hover:scale-[1.02]"
                  style={getBackgroundStyle(event)}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />

                  {/* Content Overlay */}
                  <div className="relative z-10">
                    {/* Status Badge */}
                    <div className="absolute top-0 right-0 -mt-48">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase ${event.status.toLowerCase() === "active"
                          ? "bg-green-100/80 text-green-700 backdrop-blur-sm"
                          : "bg-zinc-100/80 text-zinc-600 backdrop-blur-sm"
                        }`}>
                        {event.status}
                      </span>
                    </div>

                    {/* Logo */}
                    {event.logoUrl && (
                      <img
                        src={event.logoUrl}
                        alt="Logo"
                        className="w-14 h-14 object-contain bg-white rounded-xl shadow-sm p-2 mb-4"
                      />
                    )}

                    {/* Title */}
                    <h3 dir="auto" className="text-2xl font-serif font-medium text-zinc-900 leading-tight mb-2 group-hover:text-black transition-colors">
                      {event.eventTitle}
                    </h3>

                    {/* Location */}
                    {event.location && (
                      <div dir="auto" className="flex items-center text-zinc-500 text-xs font-medium tracking-wide uppercase">
                        <MapPin className="w-3.5 h-3.5 mr-1.5" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-8 bg-white border-t border-zinc-50 space-y-5">
                  <div className="space-y-3">
                    {/* Date */}
                    <div dir="auto" className="flex items-center text-sm text-zinc-500">
                      <Calendar className="w-4 h-4 mr-3 text-zinc-300" />
                      <span className="font-light">{formatDateRange(event.startDate, event.endDate)}</span>
                    </div>

                    {/* Gates */}
                    <div className="flex items-center text-sm text-zinc-500">
                      <DoorOpen className="w-4 h-4 mr-3 text-zinc-300" />
                      <span className="font-light">{event.gates?.length || 0} Gates Available</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="pt-4 flex items-center justify-between text-sm font-medium text-zinc-900 group-hover:text-black transition-colors">
                    <span className="font-serif italic">Access Event</span>
                    <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                      <ChevronRight className="w-4 h-4" />
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