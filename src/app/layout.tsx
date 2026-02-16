import type { Metadata } from "next";
import { Inter, Geist, Space_Grotesk } from "next/font/google";
import { AuthProvider } from '@/lib/supabase/auth-context';
import { ToastProvider } from '@/components/ui/Toast';
import "./globals.css";

// Force dynamic rendering for auth-dependent app
export const dynamic = 'force-dynamic';

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});


const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
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
      <body className={`${inter.variable} ${geist.variable} ${spaceGrotesk.variable} antialiased`}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
