import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UniLearn | The Intelligent Academic Workspace",
  description: "Experience the future of education with UniLearn. A premium, enterprise-grade SaaS platform for students, educators, and institutions.",
  keywords: ["LMS", "University Management", "SaaS", "Education Technology", "Academic Analytics"],
  openGraph: {
    title: "UniLearn | The Intelligent Academic Workspace",
    description: "Experience the future of education with UniLearn. A premium, enterprise-grade SaaS platform for students, educators, and institutions.",
    url: "https://unilearn.edu",
    siteName: "UniLearn",
    images: [
      {
        url: "https://unilearn.edu/og-image.png",
        width: 1200,
        height: 630,
        alt: "UniLearn Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UniLearn | The Intelligent Academic Workspace",
    description: "The intelligent academic workspace for modern institutions.",
    images: ["https://unilearn.edu/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  }
};

import { SocketProvider } from "@/context/SocketContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SentinelProvider } from "@/context/SentinelContext";
import ThemeToggle from "@/components/shared/ThemeToggle";
import CommandPalette from "@/components/shared/CommandPalette";
import SentinelWrapper from "../components/shared/SentinelWrapper";
import ImpersonationBanner from "@/components/shared/ImpersonationBanner";
import QueryProvider from "@/components/providers/QueryProvider";
import { SentryProvider } from "@/components/providers/SentryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="font-sans antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>
        <AuthProvider>
          <SentryProvider>
            <QueryProvider>
              <SocketProvider>
                <ThemeProvider>
                  <SentinelProvider>
                    <ImpersonationBanner />
                    <ThemeToggle />
                    <SentinelWrapper />
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        className: 'react-hot-toast',
                        style: {
                          borderRadius: '12px',
                          background: '#fff',
                          color: '#0f172a',
                          fontSize: '14px',
                          fontWeight: '500',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        },
                      }}
                    />
                    {children}
                  </SentinelProvider>
                </ThemeProvider>
              </SocketProvider>
            </QueryProvider>
          </SentryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
