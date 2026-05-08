'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Heart, Calendar, MapPin, User, Info, Smartphone, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface TokenData {
    registrationId: string;
    eventId: string;
    companyId: string;
    email: string;
    firstName: string;
    lastName: string;
    isVIP: boolean;
    tokenType?: string;
    passHolderType?: string;
    ticketLabel?: string;
    backgroundColor?: string;
    eventTitle?: string;
    eventDate?: string;
    eventVenue?: string;
    qrCodeContent?: string;
}

function MarriagePassContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tokenData, setTokenData] = useState<TokenData | null>(null);
    const [walletLoading, setWalletLoading] = useState<string | null>(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7003';

    useEffect(() => {
        if (!token) {
            setError('عذراً، الرابط غير صحيح');
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
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'عذراً، الرابط منتهي الصلاحية أو غير صالح');
            }

            const data = await response.json();
            setTokenData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    const getWalletEndpoint = (walletType: 'apple' | 'google' | 'samsung') => {
        const baseUrl = `${API_BASE_URL}/api/EventWallet`;
        return {
            endpoint: `${baseUrl}/${walletType}/generate-event-ticket`,
            params: `registrationId=${tokenData?.registrationId || ''}&email=${encodeURIComponent(tokenData?.email || '')}`
        };
    };

    const handleAddToAppleWallet = async () => {
        if (!tokenData?.registrationId) return;
        try {
            setWalletLoading('apple');
            const { endpoint, params } = getWalletEndpoint('apple');
            window.location.href = `${endpoint}?${params}`;
            // Keep loading for longer as the file generation takes time and browser takes time to trigger download
            setTimeout(() => setWalletLoading(null), 10000);
        } catch (error) {
            console.error("Error:", error);
            alert('Failed to generate Apple Wallet pass.');
            setWalletLoading(null);
        }
    };

    const handleAddToGoogleWallet = async () => {
        if (!tokenData?.registrationId) return;
        try {
            setWalletLoading('google');
            const { endpoint, params } = getWalletEndpoint('google');
            const response = await fetch(`${endpoint}?${params}`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to generate pass');
            const data = await response.json();
            if (data.walletUrl) window.location.href = data.walletUrl;
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
            const { endpoint, params } = getWalletEndpoint('samsung');
            const response = await fetch(`${endpoint}?${params}`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to generate pass');
            const data = await response.json();
            if (data.walletUrl) window.location.href = data.walletUrl;
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate Samsung Wallet pass.');
        } finally {
            setWalletLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4" dir="rtl">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-[#C5A059] animate-spin mx-auto mb-6" />
                    <p className="text-2xl font-bold text-[#5D4037]">جاري عرض البطاقة...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4" dir="rtl">
                <div className="bg-white rounded-[2rem] shadow-xl p-10 max-w-md w-full text-center border-2 border-red-100">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Info className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">تنبيه</h2>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">{error}</p>
                    <p className="text-sm text-gray-400">يرجى مراجعة منظم الحفل للحصول على رابط جديد.</p>
                </div>
            </div>
        );
    }

    const qrValue = tokenData?.qrCodeContent || tokenData?.registrationId || '';

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center py-4 px-3" dir="rtl">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;700;900&display=swap');
                body {
                    font-family: 'IBM Plex Sans Arabic', sans-serif;
                    overflow-x: hidden;
                }
            `}</style>

            {/* Main Pass Container */}
            <div className="bg-white rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.08)] overflow-hidden max-w-[360px] w-full border border-[#C5A059]/20 relative">
                
                {/* Slim Decorative Top Bar */}
                <div className="h-2 bg-gradient-to-r from-[#C5A059] via-[#E6D5B8] to-[#C5A059]"></div>

                {/* Compact Header - Groom & Bride Focus */}
                <div className="pt-5 pb-3 text-center px-4 border-b border-[#C5A059]/10">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Heart className="w-4 h-4 text-[#C5A059] fill-[#C5A059]/20" />
                        <span className="text-[#C5A059] text-xs font-bold uppercase tracking-widest">دعوة زفاف</span>
                        <Heart className="w-4 h-4 text-[#C5A059] fill-[#C5A059]/20" />
                    </div>
                    <h1 className="text-2xl font-black text-[#5D4037] leading-tight">
                        {tokenData?.eventTitle || "حفل زفاف"}
                    </h1>
                    <p className="text-gray-400 text-xs font-bold mt-1">يتشرفون بقدومكم الكريم</p>
                </div>

                {/* QR Code Section - More Dense */}
                <div className="px-5 pb-5 pt-4">
                    <div className="bg-[#FDFBF7] p-4 rounded-[2rem] border border-[#C5A059]/15 flex flex-col items-center shadow-inner">
                        <div className="bg-white p-2.5 rounded-[1.5rem] shadow-sm border border-gray-100">
                            <QRCodeCanvas 
                                value={qrValue} 
                                size={180}
                                level="H"
                                includeMargin={true}
                                fgColor="#3E2723"
                            />
                        </div>
                        <p className="text-[#5D4037] mt-3 text-lg font-black tracking-tight">أبرز الكود عند المدخل</p>
                    </div>
                </div>

                {/* Guest & Event Details - High Density */}
                <div className="px-5 pb-4 space-y-3">
                    
                    {/* Guest Name - Horizontal Layout */}
                    <div className="flex items-center gap-3 bg-[#FDFBF7]/50 p-2.5 rounded-2xl border border-[#C5A059]/10">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-[#C5A059]/20 shrink-0">
                            <User className="w-5 h-5 text-[#C5A059]" />
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-400 text-[10px] font-bold uppercase mb-0.5">اسم الضيف</p>
                            <p className="text-lg font-black text-[#5D4037] truncate">
                                {tokenData?.firstName} {tokenData?.lastName}
                            </p>
                        </div>
                    </div>

                    {/* Date & Venue Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {tokenData?.eventDate && (
                            <div className="flex items-center gap-2 bg-[#FDFBF7]/30 p-2 rounded-xl">
                                <Calendar className="w-4 h-4 text-[#C5A059] shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-gray-400 text-[9px] font-bold mb-0">التاريخ</p>
                                    <p className="text-[11px] font-black text-gray-700 truncate">{tokenData.eventDate}</p>
                                </div>
                            </div>
                        )}
                        {tokenData?.eventVenue && (
                            <div className="flex items-center gap-2 bg-[#FDFBF7]/30 p-2 rounded-xl">
                                <MapPin className="w-4 h-4 text-[#C5A059] shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-gray-400 text-[9px] font-bold mb-0">المكان</p>
                                    <p className="text-[11px] font-black text-gray-700 truncate">{tokenData.eventVenue}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Section - Wallet & Share Integrated */}
                <div className="px-5 pb-5 pt-3 border-t border-gray-50 bg-[#FDFBF7]/20">
                    <div className="space-y-2">
                        {/* Apple Wallet (Main Action) */}
                        <button
                            onClick={handleAddToAppleWallet}
                            disabled={walletLoading === 'apple'}
                            className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-xl text-sm font-bold active:scale-95 disabled:opacity-50"
                        >
                            {walletLoading === 'apple' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                            )}
                            حفظ في Apple Wallet
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleAddToGoogleWallet}
                                disabled={walletLoading === 'google'}
                                className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 py-2 rounded-xl text-xs font-bold active:scale-95 shadow-sm"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                Google
                            </button>
                            <button
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({ title: 'بطاقة دخول حفل زفاف', url: window.location.href });
                                    }
                                }}
                                className="flex items-center justify-center gap-1.5 bg-[#C5A059] text-white py-2 rounded-xl text-xs font-bold active:scale-95 shadow-sm"
                            >
                                <Info className="w-3.5 h-3.5" />
                                مشاركة البطاقة
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4" dir="rtl">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-[#C5A059] animate-spin mx-auto mb-4" />
                <p className="text-xl font-bold text-[#5D4037]">جاري التحميل...</p>
            </div>
        </div>
    );
}

export default function MarriagePassPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <MarriagePassContent />
        </Suspense>
    );
}
