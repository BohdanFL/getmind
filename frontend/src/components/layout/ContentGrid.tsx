import React from 'react';

interface ContentGridProps {
    children: React.ReactNode;
}

export function ContentGrid({ children }: ContentGridProps) {
    return (
        <div className="max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 relative z-10 min-h-0">
            {children}
        </div>
    );
}
