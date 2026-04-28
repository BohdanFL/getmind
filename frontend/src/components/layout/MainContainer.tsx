import React from 'react';
import { BackgroundEffects } from './BackgroundEffects';
import { AppHeader } from './AppHeader';

interface MainContainerProps {
    children: React.ReactNode;
}

export function MainContainer({ children }: MainContainerProps) {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 flex flex-col font-sans selection:bg-neon-blue/30 overflow-hidden relative">
            <BackgroundEffects />
            <AppHeader />
            {children}
        </main>
    );
}
