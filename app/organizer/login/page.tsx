import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { organizerApi } from "@/lib/organizerApi";
import { User, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f9fa]">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-zinc-400 animate-spin mx-auto" />
        <p className="mt-4 text-zinc-500 text-sm font-medium font-serif italic">Loading Portal...</p>
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
    <div className="min-h-screen flex items-center justify-center relative bg-[#f9f9fa] text-zinc-900 overflow-hidden selection:bg-black/10 selection:text-black">
      {/* Luxurious/Subtle Background */}
      <div className="absolute inset-0 bg-luxury-gradient opacity-80" />
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-100/30 rounded-full blur-3xl mix-blend-multiply" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-3xl mix-blend-multiply" />

      <div className="relative z-10 w-full max-w-[400px] px-4">
        {/* Glass Card */}
        <div className="backdrop-blur-md bg-white/70 border border-white/50 rounded-2xl shadow-glass-md p-10">

          {/* Header */}
          <div className="mb-10 text-start dynamic-content">
            <h1 dir="auto" className="text-3xl font-serif font-medium text-zinc-900 mb-2 tracking-tight dynamic-content">Organizer Portal</h1>
            <p dir="auto" className="text-zinc-500 text-sm font-light dynamic-content">Sign in to manage your events</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label
                dir="auto"
                className={`text-xs uppercase tracking-wider font-semibold transition-colors dynamic-content ${
                  focusedField === 'username' ? 'text-black' : 'text-zinc-400'
                }`}
              >
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                  <User className={`w-4 h-4 transition-colors ${
                    focusedField === 'username' ? 'text-black' : 'text-zinc-400'
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
                  dir="auto"
                  className="w-full ps-10 pe-4 py-3 bg-white/50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all hover:bg-white/80 hover:border-zinc-300"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                dir="auto"
                className={`text-xs uppercase tracking-wider font-semibold transition-colors dynamic-content ${
                  focusedField === 'password' ? 'text-black' : 'text-zinc-400'
                }`}
              >
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                  <Lock className={`w-4 h-4 transition-colors ${
                    focusedField === 'password' ? 'text-black' : 'text-zinc-400'
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
                  dir="auto"
                  className="w-full ps-10 pe-4 py-3 bg-white/50 border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all hover:bg-white/80 hover:border-zinc-300"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full group mt-4 flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-zinc-200 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
          <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-400 font-light">
              Restricted Access &bull; Authorized Personnel Only
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
