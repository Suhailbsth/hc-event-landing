"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Static translations
const translations = {
  en: {
    // Navigation
    register: "Register Now",
    backToEvents: "Back to Events",
    
    // Event Details
    date: "Date",
    time: "Time",
    location: "Location",
    venue: "Venue",
    capacity: "Capacity",
    price: "Price",
    free: "Free",
    
    // Sections
    aboutEvent: "About Event",
    eventHighlights: "Event Highlights",
    agenda: "Event Agenda",
    
    // Registration
    registerForEvent: "Register for this Event",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email Address",
    phone: "Phone Number",
    company: "Company",
    position: "Position",
    ticketType: "Ticket Type",
    regularTicket: "Regular Ticket",
    vipTicket: "VIP Ticket",
    submit: "Submit Registration",
    submitting: "Submitting...",
    
    // Messages
    registrationSuccess: "Registration Successful!",
    registrationError: "Registration failed. Please try again.",
    requiredField: "This field is required",
    invalidEmail: "Please enter a valid email",
    
    // Event Status
    spotsLeft: "spots left",
    soldOut: "Sold Out",
    registrationClosed: "Registration Closed",
    registrationOpen: "Registration Open",
    
    // Footer
    contactUs: "Contact Us",
    followUs: "Follow Us",
    organizedBy: "Organized by"
  },
  ar: {
    // Navigation
    register: "سجل الآن",
    backToEvents: "العودة للفعاليات",
    
    // Event Details
    date: "التاريخ",
    time: "الوقت",
    location: "الموقع",
    venue: "المكان",
    capacity: "السعة",
    price: "السعر",
    free: "مجاني",
    
    // Sections
    aboutEvent: "عن الفعالية",
    eventHighlights: "أبرز النقاط",
    agenda: "جدول الأعمال",
    
    // Registration
    registerForEvent: "التسجيل في الفعالية",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    company: "الشركة",
    position: "المنصب",
    ticketType: "نوع التذكرة",
    regularTicket: "تذكرة عادية",
    vipTicket: "تذكرة VIP",
    submit: "إرسال التسجيل",
    submitting: "جاري الإرسال...",
    
    // Messages
    registrationSuccess: "تم التسجيل بنجاح!",
    registrationError: "فشل التسجيل. يرجى المحاولة مرة أخرى.",
    requiredField: "هذا الحقل مطلوب",
    invalidEmail: "يرجى إدخال بريد إلكتروني صحيح",
    
    // Event Status
    spotsLeft: "مقعد متبقي",
    soldOut: "نفذت التذاكر",
    registrationClosed: "التسجيل مغلق",
    registrationOpen: "التسجيل مفتوح",
    
    // Footer
    contactUs: "اتصل بنا",
    followUs: "تابعنا",
    organizedBy: "ينظمها"
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('eventLang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      setLanguageState(savedLang);
      applyDirection(savedLang);
    }
  }, []);

  const applyDirection = (lang: Language) => {
    const html = document.documentElement;
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    html.setAttribute('lang', lang);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('eventLang', lang);
    applyDirection(lang);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
