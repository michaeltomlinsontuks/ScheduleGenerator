'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header, Footer, ThemeProvider } from "@/components/layout";
import { usePathname } from 'next/navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine stepper state based on current path
  const getStepperProps = () => {
    if (pathname === '/upload') return { showStepper: true, currentStep: 1 as const };
    if (pathname === '/preview') return { showStepper: true, currentStep: 2 as const };
    if (pathname === '/customize') return { showStepper: true, currentStep: 3 as const };
    if (pathname === '/generate') return { showStepper: true, currentStep: 4 as const };
    return { showStepper: false };
  };

  const stepperProps = getStepperProps();

  return (
    <ThemeProvider>
      <Header {...stepperProps} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </ThemeProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="schedule-light" suppressHydrationWarning>
      <head>
        <title>Tuks Schedule Generator</title>
        <meta name="description" content="Convert your Tuks PDF schedule to calendar events" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-base-100 flex flex-col`}
      >
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
