'use client';

import { useState } from 'react';
import { registerForEvent, RegistrationRequest, EventData } from '@/lib/eventApi';
import { Loader2, CheckCircle } from 'lucide-react';
import SuccessMessage from './SuccessMessage';
import { useLanguage } from '@/contexts/LanguageContext';

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

interface RegistrationFormProps {
  event: EventData;
}

export default function RegistrationForm({ event }: RegistrationFormProps) {
  const { language, t } = useLanguage();
  const isArabic = language === 'ar';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    success: boolean;
    message: string;
    registration: RegistrationData;
  } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    city: '',
    country: '',
    registrationType: 'regular' as 'regular' | 'vip',
    // dietaryRequirements: '',
    // specialRequests: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const request: RegistrationRequest = {
        eventId: event.id,
        companyId: event.companyId,
        ...formData,
        registrationSource: 'landing_page',
      };

      const response = await registerForEvent(request);
      setSuccess(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return <SuccessMessage registration={success} event={event} />;
  }

  const isEventFull = event.totalRegistrations >= event.capacity;
  const isRegistrationClosed = !event.registrationOpen;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className={`text-2xl font-bold text-gray-900 mb-6 ${isArabic ? 'text-right' : ''}`}>
        {isArabic ? 'التسجيل في الفعالية' : 'Register for Event'}
      </h2>

      {isRegistrationClosed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 font-medium">
            {isArabic ? 'التسجيل مغلق' : 'Registration is closed'}
          </p>
        </div>
      )}

      {isEventFull && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-700 font-medium">
            {isArabic ? 'الفعالية ممتلئة' : 'Event is full'}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name Fields */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              {isArabic ? 'الاسم الأول' : 'First Name'} *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={isRegistrationClosed || isEventFull}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
              placeholder={isArabic ? 'أدخل الاسم الأول' : 'Enter first name'}
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              {isArabic ? 'اسم العائلة' : 'Last Name'} *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={isRegistrationClosed || isEventFull}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
              placeholder={isArabic ? 'أدخل اسم العائلة' : 'Enter last name'}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {isArabic ? 'البريد الإلكتروني' : 'Email'} *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isRegistrationClosed || isEventFull}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
            placeholder={isArabic ? 'example@email.com' : 'example@email.com'}
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            {isArabic ? 'رقم الهاتف' : 'Phone Number'}
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={isRegistrationClosed || isEventFull}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
            placeholder={isArabic ? '+971 50 123 4567' : '+971 50 123 4567'}
          />
        </div>

        {/* Company & Job Title */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              {isArabic ? 'الشركة' : 'Company'}
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              disabled={isRegistrationClosed || isEventFull}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
              placeholder={isArabic ? 'اسم الشركة' : 'Company name'}
            />
          </div>

          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
              {isArabic ? 'المسمى الوظيفي' : 'Job Title'}
            </label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              disabled={isRegistrationClosed || isEventFull}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
              placeholder={isArabic ? 'المسمى الوظيفي' : 'Your job title'}
            />
          </div>
        </div>

        {/* City & Country */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              {isArabic ? 'المدينة' : 'City'}
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={isRegistrationClosed || isEventFull}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
              placeholder={isArabic ? 'المدينة' : 'City'}
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              {isArabic ? 'الدولة' : 'Country'}
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={isRegistrationClosed || isEventFull}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
              placeholder={isArabic ? 'الدولة' : 'Country'}
            />
          </div>
        </div>

        {/* Registration Type */}
        {!event.isFree && event.maxVIPSeats > 0 && (
          <div>
            <label htmlFor="registrationType" className="block text-sm font-medium text-gray-700 mb-2">
              {isArabic ? 'نوع التسجيل' : 'Registration Type'}
            </label>
            <select
              id="registrationType"
              name="registrationType"
              value={formData.registrationType}
              onChange={handleChange}
              disabled={isRegistrationClosed || isEventFull}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="regular">
                {isArabic ? 'عادي' : 'Regular'} - {event.regularPrice} {event.currency}
              </option>
              <option value="vip">
                {isArabic ? 'VIP' : 'VIP'} - {event.vipPrice} {event.currency}
              </option>
            </select>
          </div>
        )}

        {/* Dietary Requirements */}
        {/* <div>
          <label htmlFor="dietaryRequirements" className="block text-sm font-medium text-gray-700 mb-2">
            {isArabic ? 'المتطلبات الغذائية' : 'Dietary Requirements'}
          </label>
          <input
            type="text"
            id="dietaryRequirements"
            name="dietaryRequirements"
            value={formData.dietaryRequirements}
            onChange={handleChange}
            disabled={isRegistrationClosed || isEventFull}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
            placeholder={isArabic ? 'مثال: نباتي، خالي من الغلوتين' : 'e.g., Vegetarian, Gluten-free'}
          />
        </div> */}

        {/* Special Requests */}
        {/* <div>
          <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-2">
            {isArabic ? 'طلبات خاصة' : 'Special Requests'}
          </label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            rows={3}
            disabled={isRegistrationClosed || isEventFull}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none text-black"
            placeholder={isArabic ? 'أي طلبات أو ملاحظات إضافية' : 'Any additional requests or notes'}
          />
        </div> */}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isRegistrationClosed || isEventFull}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {isArabic ? 'جارٍ التسجيل...' : 'Registering...'}
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              {isArabic ? 'تسجيل الآن' : 'Register Now'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
