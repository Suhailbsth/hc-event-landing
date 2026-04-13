"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    register: "Register Now",
    backToEvents: "Back to Events",
    date: "Date",
    time: "Time",
    location: "Location",
    venue: "Venue",
    capacity: "Capacity",
    price: "Price",
    free: "Free",
    aboutEvent: "About Event",
    eventHighlights: "Event Highlights",
    agenda: "Event Agenda",
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
    registrationSuccess: "Registration Successful!",
    registrationError: "Registration failed. Please try again.",
    requiredField: "This field is required",
    invalidEmail: "Please enter a valid email",
    spotsLeft: "spots left",
    soldOut: "Sold Out",
    registrationClosed: "Registration Closed",
    registrationOpen: "Registration Open",
    contactUs: "Contact Us",
    followUs: "Follow Us",
    organizedBy: "Organized by",
  },
  ar: {
    register: "سجل الآن",
    backToEvents: "العودة للفعاليات",
    date: "التاريخ",
    time: "الوقت",
    location: "الموقع",
    venue: "المكان",
    capacity: "السعة",
    price: "السعر",
    free: "مجاني",
    aboutEvent: "عن الفعالية",
    eventHighlights: "أبرز النقاط",
    agenda: "جدول الأعمال",
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
    registrationSuccess: "تم التسجيل بنجاح!",
    registrationError: "فشل التسجيل. يرجى المحاولة مرة أخرى.",
    requiredField: "هذا الحقل مطلوب",
    invalidEmail: "يرجى إدخال بريد إلكتروني صحيح",
    spotsLeft: "مقعد متبقي",
    soldOut: "نفذت التذاكر",
    registrationClosed: "التسجيل مغلق",
    registrationOpen: "التسجيل مفتوح",
    contactUs: "اتصل بنا",
    followUs: "تابعنا",
    organizedBy: "ينظمها",
  },
} as const;

export function LanguageProvider({
  children,
  initialLanguage = "en",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    const cookieMatch = document.cookie.match(/(?:^|;\s*)eventLang=(en|ar)(?:;|$)/);
    const cookieLang = cookieMatch?.[1] as Language | undefined;
    const storedLang = localStorage.getItem("eventLang");
    const savedLang = (storedLang === "en" || storedLang === "ar" ? storedLang : cookieLang) as
      | Language
      | undefined;

    if (savedLang && savedLang !== language) {
      setLanguageState(savedLang);
    }

    if (savedLang) {
      localStorage.setItem("eventLang", savedLang);
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("eventLang", lang);
    document.cookie = `eventLang=${lang}; path=/; max-age=31536000; samesite=lax`;
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
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
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
