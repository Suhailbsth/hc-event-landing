"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { organizerApi } from "@/lib/organizerApi";
import { User, Lock, ArrowRight, Loader2, AlertCircle, LayoutDashboard } from "lucide-react";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-zinc-400 animate-spin mx-auto" />
        <p className="mt-4 text-zinc-500 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

function OrganizerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const returnToEventId = searchParams.get("returnTo");
  const returnToEventTitle = searchParams.get("eventTitle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await organizerApi.login(username, password);
      localStorage.setItem("organizerToken", response.token);
      if (response.user) {
        localStorage.setItem("organizerUser", JSON.stringify(response.user));
      }

      const assignedEvents = response.assignedEvents || [];

      if (returnToEventId) {
        const matchingEvent = assignedEvents.find(
          (e: { eventId: string }) => e.eventId === returnToEventId
        );

        if (matchingEvent && assignedEvents.length === 1) {
          router.push(`/organizer/events/${matchingEvent.eventId}/gates`);
          return;
        } else if (matchingEvent) {
          router.push("/organizer/events");
          return;
        } else {
          const warningParam = `?notAssignedTo=${encodeURIComponent(returnToEventTitle || "that event")}`;
          router.push(`/organizer/events${warningParam}`);
          return;
        }
      }

      router.push("/organizer/events");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-zinc-950 text-zinc-100 overflow-hidden selection:bg-zinc-700 selection:text-white">
      {/* Abstract Minimal Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-zinc-900/50 to-transparent opacity-40 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] px-4">
        {/* Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-6 shadow-glow">
              <LayoutDashboard className="w-6 h-6 text-zinc-200" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">Organizer Portal</h1>
            <p className="text-zinc-400 text-sm">Sign in to manage your events</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label
                className={`text-xs font-medium transition-colors ${focusedField === 'username' ? 'text-zinc-300' : 'text-zinc-500'
                  }`}
              >
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`w-4 h-4 transition-colors ${focusedField === 'username' ? 'text-zinc-300' : 'text-zinc-500'
                    }`} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all hover:bg-black/30 hover:border-white/15"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                className={`text-xs font-medium transition-colors ${focusedField === 'password' ? 'text-zinc-300' : 'text-zinc-500'
                  }`}
              >
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`w-4 h-4 transition-colors ${focusedField === 'password' ? 'text-zinc-300' : 'text-zinc-500'
                    }`} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all hover:bg-black/30 hover:border-white/15"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full group mt-2 flex items-center justify-center gap-2 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-zinc-500">
              Need assistance? Contact your administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrganizerLoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrganizerLoginContent />
    </Suspense>
  );
}
