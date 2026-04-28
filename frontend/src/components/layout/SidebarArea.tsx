import React from 'react';

interface SidebarAreaProps {
    children: React.ReactNode;
}

export function SidebarArea({ children }: SidebarAreaProps) {
    return (
        <div className="lg:col-span-4 flex flex-col space-y-4 h-[calc(100vh-180px)]">
            {children}
        </div>
    );
}
