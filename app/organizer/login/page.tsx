"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { organizerApi } from "@/lib/organizerApi";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full animate-spin border-t-purple-500"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-purple-400 opacity-20"></div>
        </div>
        <p className="mt-6 text-purple-200 font-medium">Loading...</p>
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Glass Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 md:p-10">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v-1a6 6 0 00-3-5.197"
                  />
                </svg>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl blur opacity-30 -z-10"></div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Organizer Portal</h1>
            <p className="text-purple-200/80">Sign in to manage event check-ins</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm animate-shake">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="relative">
              <label
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${focusedField === 'username' || username
                    ? 'top-2 text-xs text-purple-300'
                    : 'top-4 text-sm text-purple-200/60'
                  }`}
              >
                Username or Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                required
                disabled={loading}
                className="w-full px-4 pt-6 pb-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 disabled:opacity-50"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <label
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${focusedField === 'password' || password
                    ? 'top-2 text-xs text-purple-300'
                    : 'top-4 text-sm text-purple-200/60'
                  }`}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                disabled={loading}
                className="w-full px-4 pt-6 pb-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl transition-all duration-300 group-hover:scale-105"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 rounded-xl shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow duration-300"></div>
              <span className="relative flex items-center justify-center py-4 px-6 text-white font-semibold">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-purple-200/60">
              Need help? Contact your event administrator
            </p>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-purple-500/20 blur-3xl"></div>
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
