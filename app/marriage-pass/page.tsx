'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Heart, Calendar, MapPin, User, Users, Info, Smartphone, Download, Check, X } from 'lucide-react';
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
    status?: string;
    cancellationReason?: string;
    companions?: number;
}

function MarriagePassContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tokenData, setTokenData] = useState<TokenData | null>(null);
    const [walletLoading, setWalletLoading] = useState<string | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [showRejectReason, setShowRejectReason] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

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

    const handleUpdateStatus = async (newStatus: 'accepted' | 'rejected') => {
        if (!token) return;
        
        try {
            setStatusLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/EventWallet/update-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    status: newStatus,
                    reason: newStatus === 'rejected' ? rejectionReason : null
                })
            });

            if (!response.ok) throw new Error('فشل تحديث الحالة');

            // Refresh data to show new status
            await validateToken();
            setShowRejectReason(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث');
        } finally {
            setStatusLoading(false);
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
            
            const response = await fetch(`${endpoint}?${params}`);
            if (!response.ok) throw new Error('Failed to generate pass');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `event-pass-${tokenData.registrationId}.pkpass`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch (error) {
            console.error("Error:", error);
            alert('Failed to generate Apple Wallet pass.');
        } finally {
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
    const isAccepted = tokenData?.status === 'confirmed' || tokenData?.status === 'checked_in';
    const isRejected = tokenData?.status === 'cancelled';
    const hasResponded = isAccepted || isRejected;

    return (
        <div className="min-h-screen bg-[#FDFBF7] relative overflow-x-hidden" dir="rtl">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;700;900&display=swap');
                body {
                    font-family: 'IBM Plex Sans Arabic', sans-serif;
                }
            `}</style>

            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#C5A059]/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 -right-32 w-80 h-80 bg-[#E6D5B8]/20 rounded-full blur-3xl"></div>
            </div>

            <div className={`flex flex-col items-center py-4 px-3 transition-all duration-700 ${!hasResponded ? 'blur-md grayscale-[0.3] pointer-events-none scale-95' : 'scale-100'}`}>
                
                {/* Main Pass Container */}
                <div className="bg-white rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.1)] overflow-hidden max-w-[360px] w-full border border-[#C5A059]/15 relative">
                    
                    {/* Premium Top Bar */}
                    <div className="h-1.5 bg-gradient-to-r from-[#C5A059] via-[#F3E5AB] to-[#C5A059]"></div>

                    {/* Header Section */}
                    <div className="pt-5 pb-3 text-center px-6 border-b border-[#C5A059]/10">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <div className="h-[1px] w-6 bg-[#C5A059]/30"></div>
                            <span className="text-[#C5A059] text-[9px] font-black uppercase tracking-[0.2em]">دعوة زفاف خـاصة</span>
                            <div className="h-[1px] w-6 bg-[#C5A059]/30"></div>
                        </div>
                        <h1 className="text-2xl font-black text-[#5D4037] leading-tight mb-1">
                            {tokenData?.eventTitle || "حفل زفاف"}
                        </h1>
                        <p className="text-[#C5A059] text-[10px] font-bold tracking-wide italic">نتشرف بحضوركم الكريم</p>
                    </div>

                    {/* RSVP Status Banner (Only after responding) */}
                    {hasResponded && (
                        <div className={`py-2.5 px-6 text-center ${isAccepted ? 'bg-green-50 border-b border-green-100' : 'bg-gray-50 border-b border-gray-100'}`}>
                            {isAccepted ? (
                                <div className="flex items-center justify-center gap-2 text-green-600">
                                    <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    <span className="text-[11px] font-black tracking-tight">تم تأكيد حضورك بنجاح</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-gray-500">
                                    <div className="w-5 h-5 bg-gray-400 text-white rounded-full flex items-center justify-center">
                                        <X className="w-3 h-3" />
                                    </div>
                                    <span className="text-[11px] font-black tracking-tight">تم تسجيل اعتذارك</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* QR Code Section - Only if accepted */}
                    {isAccepted ? (
                        <div className="p-4">
                            <div className="bg-[#FDFBF7] p-4 rounded-[2rem] border border-[#C5A059]/15 flex flex-col items-center shadow-[inset_0_2px_10px_rgba(197,160,89,0.05)]">
                                <div className="bg-white p-3 rounded-[1.5rem] shadow-lg border border-white relative group">
                                    <QRCodeCanvas 
                                        value={qrValue} 
                                        size={160}
                                        level="H"
                                        includeMargin={true}
                                        fgColor="#3E2723"
                                        className="relative z-10"
                                    />
                                </div>
                                <div className="mt-3 flex flex-col items-center gap-0.5">
                                    <p className="text-[#5D4037] text-lg font-black tracking-tight leading-none">أبرز الكود عند المدخل</p>
                                    <p className="text-gray-400 text-[9px] font-bold">يرجى تجهيز الكود لتسهيل عملية الدخول</p>
                                </div>
                            </div>
                        </div>
                    ) : isRejected ? (
                        <div className="p-10 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-2 border-gray-100">
                                <X className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-black text-gray-400 mb-2">تم تسجيل الاعتذار</h3>
                            <p className="text-gray-400 text-xs font-medium max-w-[200px]">نشكرك على الرد، ونتمنى لكم دوام الأفراح والمسرات</p>
                        </div>
                    ) : null}

                    {/* Guest & Details Section */}
                    <div className="px-4 pb-4 space-y-3">
                        
                        {/* Guest Profile Card */}
                        <div className="bg-[#FDFBF7]/80 backdrop-blur-sm p-3 rounded-[1.2rem] border border-[#C5A059]/10 flex items-center gap-3 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#C5A059]"></div>
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-[#C5A059]/20 shadow-sm shrink-0">
                                <User className="w-5 h-5 text-[#C5A059]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-400 text-[9px] font-bold uppercase mb-0.5 tracking-wider">اسم الضيف</p>
                                <div className="flex flex-col gap-1">
                                    <p className="text-lg font-black text-[#5D4037] truncate leading-tight">
                                        {tokenData?.firstName} {tokenData?.lastName}
                                    </p>
                                    {tokenData?.companions !== undefined && tokenData.companions > 0 && (
                                        <div className="bg-[#C5A059] text-white px-4 py-2.5 rounded-xl text-base font-black shrink-0 shadow-lg shadow-[#C5A059]/20 flex items-center gap-2 w-fit mt-1.5">
                                            <Users className="w-6 h-6" />
                                            <span>عدد المرافقين: {tokenData.companions}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Event Info Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-2.5">
                                <Calendar className="w-4 h-4 text-[#C5A059]" />
                                <div className="min-w-0">
                                    <p className="text-gray-400 text-[8px] font-bold mb-0">التاريخ</p>
                                    <p className="text-[10px] font-black text-gray-700 truncate">{tokenData?.eventDate}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-2.5">
                                <MapPin className="w-4 h-4 text-[#C5A059]" />
                                <div className="min-w-0">
                                    <p className="text-gray-400 text-[8px] font-bold mb-0">المكان</p>
                                    <p className="text-[10px] font-black text-gray-700 truncate">{tokenData?.eventVenue}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Footer - Only if accepted */}
                    {isAccepted && (
                        <div className="px-4 pb-6 pt-3 border-t border-gray-50 bg-gray-50/30">
                            <div className="space-y-2.5">
                                <button
                                    onClick={handleAddToAppleWallet}
                                    disabled={walletLoading === 'apple'}
                                    className="w-full flex items-center justify-center gap-2.5 bg-black text-white py-3.5 rounded-xl text-sm font-black active:scale-[0.98] transition-transform disabled:opacity-50 shadow-xl shadow-black/10"
                                >
                                    {walletLoading === 'apple' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                        </svg>
                                    )}
                                    إضافة إلى Apple Wallet
                                </button>

                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        onClick={handleAddToGoogleWallet}
                                        disabled={walletLoading === 'google'}
                                        className="flex items-center justify-center gap-2 bg-white border-2 border-gray-100 text-gray-700 py-3 rounded-xl text-[11px] font-black active:scale-[0.98] transition-transform shadow-sm"
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
                                        className="flex items-center justify-center gap-2 bg-[#C5A059] text-white py-3 rounded-xl text-[11px] font-black active:scale-[0.98] transition-transform shadow-lg shadow-[#C5A059]/20"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        مشاركة
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rejected State Action */}
                    {isRejected && (
                        <div className="px-6 pb-6 pt-3 border-t border-gray-50 bg-gray-50/30 text-center">
                            <p className="text-gray-400 text-[10px] font-medium">تم تسجيل اعتذارك، نتمنى لكم دوام الأفراح</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mandatory RSVP Bottom Sheet */}
            {!hasResponded && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100] flex items-end justify-center p-0 transition-opacity duration-500">
                    <div className="bg-white w-full max-w-xl rounded-t-[3.5rem] p-10 pb-14 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom-full duration-700 ease-out flex flex-col items-center relative border-t border-[#C5A059]/10">
                        {/* Pull handle */}
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-100 rounded-full"></div>
                        
                        {/* Invitation Icon */}
                        <div className="mt-6 mb-8 relative">
                            <div className="w-24 h-24 bg-[#FDFBF7] rounded-[2rem] flex items-center justify-center border-2 border-[#C5A059]/20 shadow-inner rotate-3 transition-transform hover:rotate-0 duration-500">
                                <div className="-rotate-3">
                                    <Smartphone className="w-12 h-12 text-[#C5A059]" />
                                </div>
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#C5A059] rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white">
                                <Check className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="text-center space-y-4 mb-12">
                            <h2 className="text-4xl font-black text-[#5D4037] tracking-tight">تأكيد الحضور</h2>
                            <p className="text-gray-500 text-lg font-medium leading-relaxed max-w-[320px] mx-auto">
                                نتشرف بمشاركتك لنا هذه اللحظات السعيدة. يرجى تأكيد حضورك لتفعيل بطاقة الدخول الخاصة بك.
                            </p>
                        </div>
                        
                        <div className="w-full space-y-4 max-w-sm">
                            <button
                                onClick={() => handleUpdateStatus('accepted')}
                                disabled={statusLoading}
                                className="group w-full bg-[#C5A059] hover:bg-[#A58342] text-white py-5 rounded-[1.8rem] text-xl font-black shadow-2xl shadow-[#C5A059]/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {statusLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : (
                                    <>
                                        <Check className="w-7 h-7 transition-transform group-hover:scale-110" />
                                        <span>تأكيد الحضور الآن</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowRejectReason(true)}
                                disabled={statusLoading}
                                className="w-full bg-white border-2 border-gray-100 text-gray-400 py-5 rounded-[1.8rem] text-lg font-bold hover:bg-gray-50 hover:text-gray-500 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <X className="w-5 h-5" />
                                اعتذار عن الحضور
                            </button>
                        </div>

                        {showRejectReason && (
                            <div className="mt-10 w-full max-w-sm p-8 bg-[#FDFBF7] rounded-[2.5rem] border border-[#C5A059]/10 animate-in zoom-in-95 duration-500 shadow-sm">
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="هل تود ذكر سبب الاعتذار؟ (اختياري)"
                                    className="w-full text-base p-6 border-2 border-gray-100 focus:border-[#C5A059]/30 rounded-[1.5rem] resize-none h-36 bg-white text-gray-600 outline-none transition-all placeholder:text-gray-300"
                                />
                                <div className="flex gap-4 mt-8">
                                    <button
                                        onClick={() => handleUpdateStatus('rejected')}
                                        disabled={statusLoading}
                                        className="flex-1 bg-red-500 text-white py-5 rounded-2xl text-base font-black active:scale-95 shadow-xl shadow-red-100 transition-all"
                                    >
                                        إرسال الاعتذار
                                    </button>
                                    <button
                                        onClick={() => setShowRejectReason(false)}
                                        className="px-8 bg-white text-gray-400 py-5 rounded-2xl text-base font-bold border border-gray-100 hover:bg-gray-50"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
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
