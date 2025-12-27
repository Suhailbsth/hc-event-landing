'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Download, Smartphone, Loader2 } from 'lucide-react';

interface TokenData {
    registrationId: string;
    eventId: string;
    companyId: string;
    email: string;
    firstName: string;
    lastName: string;
    isVIP: boolean;
    eventTitle?: string;
    eventDate?: string;
    eventVenue?: string;
}

export default function DownloadPassPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tokenData, setTokenData] = useState<TokenData | null>(null);
    const [walletLoading, setWalletLoading] = useState<string | null>(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5237';

    useEffect(() => {
        if (!token) {
            setError('No download token provided');
            setLoading(false);
            return;
        }
        validateToken();
    }, [token]);

    const validateToken = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/EventWallet/validate-download-token?token=${encodeURIComponent(token!)}`,
                { method: 'GET' }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Invalid or expired link');
            }

            const data = await response.json();
            setTokenData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to validate token');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToAppleWallet = async () => {
        if (!tokenData?.registrationId) return;

        try {
            setWalletLoading('apple');
            const response = await fetch(
                `${API_BASE_URL}/api/EventWallet/apple/generate-event-ticket?registrationId=${tokenData.registrationId}&email=${encodeURIComponent(tokenData.email)}`,
                { method: 'POST' }
            );

            if (!response.ok) throw new Error('Failed to generate pass');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `event-pass-${tokenData.registrationId}.pkpass`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate Apple Wallet pass. Please try again.');
        } finally {
            setWalletLoading(null);
        }
    };

    const handleAddToGoogleWallet = async () => {
        if (!tokenData?.registrationId) return;

        try {
            setWalletLoading('google');
            const response = await fetch(
                `${API_BASE_URL}/api/EventWallet/google/generate-event-ticket?registrationId=${tokenData.registrationId}&email=${encodeURIComponent(tokenData.email)}`,
                { method: 'POST' }
            );

            if (!response.ok) throw new Error('Failed to generate pass');

            const data = await response.json();
            if (data.walletUrl) window.open(data.walletUrl, '_blank');
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate Google Wallet pass.');
        } finally {
            setWalletLoading(null);
        }
    };

    const handleAddToSamsungWallet = async () => {
        if (!tokenData?.registrationId) return;

        try {
            setWalletLoading('samsung');
            const response = await fetch(
                `${API_BASE_URL}/api/EventWallet/samsung/generate-event-ticket?registrationId=${tokenData.registrationId}&email=${encodeURIComponent(tokenData.email)}`,
                { method: 'POST' }
            );

            if (!response.ok) throw new Error('Failed to generate pass');

            const data = await response.json();
            if (data.walletUrl) window.open(data.walletUrl, '_blank');
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate Samsung Wallet pass.');
        } finally {
            setWalletLoading(null);
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Validating your download link...</p>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Invalid or Expired</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <p className="text-sm text-gray-500">
                        Please contact the event organizer to request a new download link.
                    </p>
                </div>
            </div>
        );
    }

    // Success State - Show Wallet Buttons
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                {/* Success Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Event Pass</h2>
                    {tokenData?.isVIP && (
                        <span className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                            ⭐ VIP PASS
                        </span>
                    )}
                </div>

                {/* Attendee Info */}
                <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Name</span>
                        <span className="font-semibold text-gray-900">
                            {tokenData?.firstName} {tokenData?.lastName}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Email</span>
                        <span className="text-gray-700 text-sm">{tokenData?.email}</span>
                    </div>
                    {tokenData?.eventTitle && (
                        <div className="flex justify-between items-center pt-3 border-t">
                            <span className="text-gray-500">Event</span>
                            <span className="font-semibold text-gray-900">{tokenData.eventTitle}</span>
                        </div>
                    )}
                </div>

                {/* Wallet Buttons */}
                <div className="space-y-3 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        Add to Digital Wallet
                    </h3>

                    {/* Apple Wallet */}
                    <button
                        onClick={handleAddToAppleWallet}
                        disabled={walletLoading === 'apple'}
                        className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-3"
                    >
                        {walletLoading === 'apple' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                        )}
                        Add to Apple Wallet
                    </button>

                    {/* Google Wallet */}
                    <button
                        onClick={handleAddToGoogleWallet}
                        disabled={walletLoading === 'google'}
                        className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 border-2 border-gray-300 text-gray-800 font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-3"
                    >
                        {walletLoading === 'google' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        )}
                        Add to Google Wallet
                    </button>

                    {/* Samsung Wallet */}
                    <button
                        onClick={handleAddToSamsungWallet}
                        disabled={walletLoading === 'samsung'}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-3"
                    >
                        {walletLoading === 'samsung' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Download className="w-5 h-5" />
                        )}
                        Add to Samsung Wallet
                    </button>
                </div>

                {/* Help Text */}
                <p className="text-xs text-gray-500 text-center">
                    Choose your preferred digital wallet to save your event pass.
                    <br />
                    Questions? Contact the event organizer.
                </p>
            </div>
        </div>
    );
}