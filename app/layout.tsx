import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { LanguageProvider, type Language } from "@/contexts/LanguageContext";
import HtmlDirectionProvider from "@/components/HtmlDirectionProvider";

export const metadata: Metadata = {
  title: "Event Organizer Portal",
  description: "Manage your events with elegance",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLanguage = cookieStore.get("eventLang")?.value === "ar" ? "ar" : "en";

  return (
    <html suppressHydrationWarning lang="en">
      <body
        className="antialiased"
        style={{ direction: "ltr" }}
      >
        <LanguageProvider initialLanguage={initialLanguage as Language}>
          <HtmlDirectionProvider />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
