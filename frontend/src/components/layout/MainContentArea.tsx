import React from 'react';

interface MainContentAreaProps {
    children: React.ReactNode;
}

export function MainContentArea({ children }: MainContentAreaProps) {
    return (
        <div className="lg:col-span-8 flex flex-col space-y-4 h-[calc(100vh-180px)]">
            {children}
        </div>
    );
}
