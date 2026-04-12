import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import HtmlDirectionProvider from "@/components/HtmlDirectionProvider";

export const metadata: Metadata = {
  title: "Event Organizer Portal",
  description: "Manage your events with elegance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body
        className="antialiased"
        style={{ direction: 'ltr' }}
      >
        <LanguageProvider>
          <HtmlDirectionProvider />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
