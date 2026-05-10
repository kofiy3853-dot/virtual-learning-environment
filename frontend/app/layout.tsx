import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "UniLearn | The Intelligent Academic Workspace",
  description: "Experience the future of education with UniLearn. A premium, enterprise-grade SaaS platform for students, educators, and institutions.",
  keywords: ["LMS", "University Management", "SaaS", "Education Technology", "Academic Analytics"],
  icons: {
    icon: "/favicon.ico",
  }
};

import { SocketProvider } from "@/context/SocketContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AuthProvider>
          <SocketProvider>
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
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
