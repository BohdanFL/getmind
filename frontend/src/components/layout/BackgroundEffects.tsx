import React from 'react';

export function BackgroundEffects() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[140px] animate-pulse" />
            <div
                className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[50%] bg-electric-violet/5 rounded-full blur-[140px] animate-pulse"
                style={{ animationDelay: '1s' }}
            />
        </div>
    );
}
