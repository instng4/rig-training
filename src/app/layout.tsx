import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from '@/lib/supabase/auth-context';
import { ToastProvider } from '@/components/ui/Toast';
import "./globals.css";

// Force dynamic rendering for auth-dependent app
export const dynamic = 'force-dynamic';

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RTMS - Rig Training Management System",
  description: "Centralized Workforce Training Intelligence Platform for Rig Employees",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
