'use client';

import Image from 'next/image';
import { CheckCircle, Download, Mail, Calendar } from 'lucide-react';
import { EventData } from '@/lib/eventApi';

interface RegistrationData {
  serialNumber?: string;
  registrationNumber?: string;
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
  lang: string;
}

export default function SuccessMessage({ registration, lang }: SuccessMessageProps) {
  const isArabic = lang === 'ar';
  const regData: RegistrationData = registration.registration || {};

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

      {/* Digital Wallet Pass */}
      {regData.appleWalletPassUrl && (
        <div className="mb-6">
          <button
            onClick={handleDownloadPass}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.5 4C4.6 4 3 5.6 3 7.5v9C3 18.4 4.6 20 6.5 20h11c1.9 0 3.5-1.6 3.5-3.5v-9C21 5.6 19.4 4 17.5 4h-11zm0 2h11c.8 0 1.5.7 1.5 1.5v1h-14v-1C5 6.7 5.7 6 6.5 6zM5 10.5h14v6c0 .8-.7 1.5-1.5 1.5h-11c-.8 0-1.5-.7-1.5-1.5v-6zm2 2v1h4v-1H7z"/>
            </svg>
            <span>{isArabic ? 'إضافة إلى Apple Wallet' : 'Add to Apple Wallet'}</span>
          </button>
        </div>
      )}

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
