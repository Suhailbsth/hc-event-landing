'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CheckCircle, Download, Mail, Calendar, Smartphone } from 'lucide-react';
import { EventData } from '@/lib/eventApi';
import { useLanguage } from '@/contexts/LanguageContext';

interface RegistrationData {
  serialNumber?: string;
  registrationNumber?: string;
  registrationId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  registrationType?: string;
  appleWalletPassUrl?: string;
  qrCodeUrl?: string;
}

interface SuccessMessageProps {
  registration: {
    success: boolean;
    message: string;
    registration: RegistrationData;
  };
  event: EventData;
}

export default function SuccessMessage({ registration, event }: SuccessMessageProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const regData: RegistrationData = registration.registration || {};
  const [walletLoading, setWalletLoading] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  const handleAddToAppleWallet = async () => {
    if (!regData.registrationId) return;
    
    try {
      setWalletLoading('apple');
      const url = `${API_BASE_URL}/api/EventWallet/apple/generate-pass?registrationId=${regData.registrationId}&email=${encodeURIComponent(regData.email || '')}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating Apple Wallet pass:', error);
      alert('Failed to generate Apple Wallet pass. Please try again.');
    } finally {
      setWalletLoading(null);
    }
  };

  const handleAddToGoogleWallet = async () => {
    if (!regData.registrationId) return;
    
    try {
      setWalletLoading('google');
      const response = await fetch(
        `${API_BASE_URL}/api/EventWallet/google/generate-jwt?registrationId=${regData.registrationId}&email=${encodeURIComponent(regData.email || '')}`,
        { method: 'POST' }
      );
      
      if (!response.ok) throw new Error('Failed to generate Google Wallet pass');
      
      const data = await response.json();
      if (data.walletUrl) {
        window.open(data.walletUrl, '_blank');
      }
    } catch (error) {
      console.error('Error generating Google Wallet pass:', error);
      alert('Failed to generate Google Wallet pass. Please try again.');
    } finally {
      setWalletLoading(null);
    }
  };

  const handleAddToSamsungWallet = async () => {
    if (!regData.registrationId) return;
    
    try {
      setWalletLoading('samsung');
      const response = await fetch(
        `${API_BASE_URL}/api/EventWallet/samsung/generate-jwt?registrationId=${regData.registrationId}&email=${encodeURIComponent(regData.email || '')}`,
        { method: 'POST' }
      );
      
      if (!response.ok) throw new Error('Failed to generate Samsung Wallet pass');
      
      const data = await response.json();
      if (data.walletUrl) {
        window.open(data.walletUrl, '_blank');
      }
    } catch (error) {
      console.error('Error generating Samsung Wallet pass:', error);
      alert('Failed to generate Samsung Wallet pass. Please try again.');
    } finally {
      setWalletLoading(null);
    }
  };

  const handleDownloadPass = () => {
    if (regData.appleWalletPassUrl) {
      window.open(regData.appleWalletPassUrl, '_blank');
    }
  };

  const handleDownloadQR = () => {
    if (regData.qrCodeUrl) {
      // Create a temporary link to download QR code
      const link = document.createElement('a');
      link.href = regData.qrCodeUrl;
      link.download = `event-pass-${regData.serialNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
      </div>

      {/* Title */}
      <h2 className={`text-2xl font-bold text-gray-900 mb-3 text-center ${isArabic ? 'text-right' : ''}`}>
        {isArabic ? 'تم التسجيل بنجاح!' : 'Registration Successful!'}
      </h2>

      <p className={`text-gray-600 text-center mb-8 ${isArabic ? 'text-right' : ''}`}>
        {isArabic 
          ? 'شكراً لتسجيلك في الفعالية. لقد تم إرسال تفاصيل التسجيل إلى بريدك الإلكتروني.'
          : 'Thank you for registering! Your registration details have been sent to your email.'}
      </p>

      {/* Registration Details */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-gray-600 font-medium">
            {isArabic ? 'رقم التسجيل' : 'Registration Number'}
          </span>
          <span className="text-gray-900 font-bold">
            {regData.serialNumber || regData.registrationNumber || 'N/A'}
          </span>
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-gray-600 font-medium">
            {isArabic ? 'الاسم' : 'Name'}
          </span>
          <span className="text-gray-900 font-semibold">
            {regData.firstName} {regData.lastName}
          </span>
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <span className="text-gray-600 font-medium">
            {isArabic ? 'البريد الإلكتروني' : 'Email'}
          </span>
          <span className="text-gray-900 text-sm">
            {regData.email}
          </span>
        </div>

        {regData.registrationType && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">
              {isArabic ? 'نوع التذكرة' : 'Ticket Type'}
            </span>
            <span className="text-gray-900 font-semibold uppercase">
              {regData.registrationType}
            </span>
          </div>
        )}
      </div>

      {/* QR Code */}
      {regData.qrCodeUrl && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
          <h3 className={`text-lg font-semibold text-gray-900 mb-4 text-center ${isArabic ? 'text-right' : ''}`}>
            {isArabic ? 'رمز QR للدخول' : 'Your Entry QR Code'}
          </h3>
          
          <div className="flex justify-center mb-4">
            <div className="relative w-64 h-64 bg-white p-4 rounded-lg shadow-sm">
              <Image
                src={regData.qrCodeUrl}
                alt="QR Code"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <p className={`text-sm text-gray-600 text-center mb-4 ${isArabic ? 'text-right' : ''}`}>
            {isArabic
              ? 'أحضر رمز QR هذا معك إلى الفعالية للدخول السريع'
              : 'Bring this QR code with you to the event for quick entry'}
          </p>

          <button
            onClick={handleDownloadQR}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            {isArabic ? 'تحميل رمز QR' : 'Download QR Code'}
          </button>
        </div>
      )}

      {/* Digital Wallet Passes */}
      <div className="mb-6 space-y-3">
        <h3 className={`text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Smartphone className="w-5 h-5" />
          {isArabic ? 'إضافة إلى المحفظة الرقمية' : 'Add to Digital Wallet'}
        </h3>

        {/* Apple Wallet Button */}
        <button
          onClick={handleAddToAppleWallet}
          disabled={walletLoading === 'apple'}
          className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
        >
          {walletLoading === 'apple' ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          )}
          <span>{isArabic ? 'إضافة إلى Apple Wallet' : 'Add to Apple Wallet'}</span>
        </button>

        {/* Google Wallet Button */}
        <button
          onClick={handleAddToGoogleWallet}
          disabled={walletLoading === 'google'}
          className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 border-2 border-gray-300 text-gray-800 font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
        >
          {walletLoading === 'google' ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800"></div>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span>{isArabic ? 'إضافة إلى Google Wallet' : 'Add to Google Wallet'}</span>
        </button>

        {/* Samsung Wallet Button */}
        <button
          onClick={handleAddToSamsungWallet}
          disabled={walletLoading === 'samsung'}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
        >
          {walletLoading === 'samsung' ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          )}
          <span>{isArabic ? 'إضافة إلى Samsung Wallet' : 'Add to Samsung Wallet'}</span>
        </button>

        <p className="text-xs text-gray-500 text-center mt-2">
          {isArabic
            ? 'اختر المحفظة الرقمية المفضلة لديك لإضافة تذكرة الفعالية'
            : 'Choose your preferred digital wallet to add your event pass'}
        </p>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
        <h4 className={`font-semibold text-blue-900 flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Calendar className="w-5 h-5" />
          {isArabic ? 'الخطوات التالية' : 'Next Steps'}
        </h4>
        
        <ul className={`space-y-2 text-sm text-blue-800 ${isArabic ? 'text-right' : ''}`}>
          <li className="flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {isArabic
                ? 'تحقق من بريدك الإلكتروني للحصول على تأكيد التسجيل وتفاصيل الفعالية'
                : 'Check your email for registration confirmation and event details'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {isArabic
                ? 'احفظ رمز QR أو أضف التذكرة إلى محفظتك الرقمية'
                : 'Save your QR code or add the ticket to your digital wallet'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {isArabic
                ? 'أحضر هويتك الشخصية ورمز QR معك في يوم الفعالية'
                : 'Bring your ID and QR code with you on the event day'}
            </span>
          </li>
        </ul>
      </div>

      {/* Additional Info */}
      <p className={`text-xs text-gray-500 mt-6 text-center ${isArabic ? 'text-right' : ''}`}>
        {isArabic
          ? 'إذا كانت لديك أي أسئلة، يرجى الاتصال بمنظمي الفعالية'
          : 'If you have any questions, please contact the event organizers'}
      </p>
    </div>
  );
}
