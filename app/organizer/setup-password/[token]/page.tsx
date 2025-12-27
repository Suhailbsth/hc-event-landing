"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

// Response type from token validation API
interface TokenValidationResponse {
    valid: boolean;
    email?: string;
    eventTitle?: string;
    expiresAt?: string;
    reason?: "expired" | "invalid" | "already_used";
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5237";

export default function SetupPasswordPage() {
    const router = useRouter();
    const params = useParams();
    const token = params.token as string;

    // Page states
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // Data states
    const [tokenInfo, setTokenInfo] = useState<TokenValidationResponse | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Validate token on mount
    useEffect(() => {
        if (token) {
            validateToken();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Validate the invitation token with backend
    const validateToken = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/Auth/ValidateOrganizerToken?token=${encodeURIComponent(token)}`
            );
            const data: TokenValidationResponse = await response.json();

            if (data.valid) {
                setTokenInfo(data);
            } else {
                const errorMessages: Record<string, string> = {
                    expired: "This invitation link has expired. Please contact the event administrator for a new invitation.",
                    invalid: "This invitation link is invalid. Please check the link or contact the event administrator.",
                    already_used: "This invitation has already been used. If you've already set up your account, please log in.",
                };
                setError(errorMessages[data.reason || "invalid"]);
            }
        } catch (err) {
            console.error("Token validation failed:", err);
            setError("Failed to verify invitation. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/api/Auth/SetupOrganizerPassword`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    password,
                    confirmPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to set password");
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/organizer/login");
            }, 3000);
        } catch (err) {
            const message = err instanceof Error ? err.message : "An error occurred";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    // Password validation helpers
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const passwordsMatch = password === confirmPassword && confirmPassword !== "";
    const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;
    const canSubmit = isPasswordValid && passwordsMatch && !submitting;

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto" />
                    <p className="mt-4 text-lg text-gray-600">Verifying your invitation...</p>
                </div>
            </div>
        );
    }

    // Error state (invalid/expired token)
    if (error && !tokenInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Invalid or Expired</h1>
                    <p className="text-gray-600 mb-8">{error}</p>
                    <button
                        onClick={() => router.push("/organizer/login")}
                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Account Ready!</h1>
                    <p className="text-gray-600 mb-4">Your password has been set successfully.</p>
                    <p className="text-sm text-gray-500">Redirecting to login page...</p>
                    <div className="mt-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                    </div>
                </div>
            </div>
        );
    }

    // Main form
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Set Up Your Account</h1>

                    {tokenInfo && (
                        <>
                            <p className="text-gray-600 mt-2">You&apos;ve been invited to organize:</p>
                            <p className="text-lg font-semibold text-indigo-600 mt-1">{tokenInfo.eventTitle}</p>
                            <p className="text-sm text-gray-500 mt-2">Email: {tokenInfo.email}</p>
                        </>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                {/* Password Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-900"
                            placeholder="Enter your password"
                            disabled={submitting}
                        />
                    </div>

                    {/* Password Strength Indicators */}
                    <div className="space-y-2 text-sm">
                        <div className={`flex items-center ${hasMinLength ? "text-green-600" : "text-gray-400"}`}>
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                {hasMinLength ? (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                ) : (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                )}
                            </svg>
                            At least 8 characters
                        </div>

                        <div className={`flex items-center ${hasUppercase ? "text-green-600" : "text-gray-400"}`}>
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                {hasUppercase ? (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                ) : (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                )}
                            </svg>
                            Contains uppercase letter
                        </div>

                        <div className={`flex items-center ${hasLowercase ? "text-green-600" : "text-gray-400"}`}>
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                {hasLowercase ? (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                ) : (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                )}
                            </svg>
                            Contains lowercase letter
                        </div>

                        <div className={`flex items-center ${hasNumber ? "text-green-600" : "text-gray-400"}`}>
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                {hasNumber ? (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                ) : (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                )}
                            </svg>
                            Contains number
                        </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-gray-900"
                            placeholder="Confirm your password"
                            disabled={submitting}
                        />
                    </div>

                    {/* Password Match Indicator */}
                    {confirmPassword && (
                        <div className={`flex items-center text-sm ${passwordsMatch ? "text-green-600" : "text-red-600"}`}>
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                {passwordsMatch ? (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                ) : (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                )}
                            </svg>
                            {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Setting up your account...
                            </span>
                        ) : (
                            "Set Password & Continue"
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>
                        Already have an account?{" "}
                        <a href="/organizer/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
