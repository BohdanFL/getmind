import React from 'react';
import { cn } from '@/lib/utils';

interface CognitiveLoadIndicatorProps {
    level?: number;
    max?: number;
}

export function CognitiveLoadIndicator({ level = 3, max = 5 }: CognitiveLoadIndicatorProps) {
    return (
        <div className="flex flex-col items-end space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Cognitive Load
            </span>
            <div className="flex space-x-1">
                {Array.from({ length: max }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'w-1.5 h-3 rounded-sm',
                            i < level ? 'bg-blue-500' : 'bg-slate-800',
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
