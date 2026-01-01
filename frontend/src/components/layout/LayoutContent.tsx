'use client';

import { usePathname } from 'next/navigation';
import { Header, Footer, ThemeProvider } from "@/components/layout";

export function LayoutContent({ children }: { children: React.ReactNode }) {
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
