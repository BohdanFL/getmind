import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Lock, BookOpen, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GraphNode } from '../types';

interface ConceptNodeProps {
    data: GraphNode;
    selected: boolean;
}

function ConceptNode({ data, selected }: ConceptNodeProps) {
    const isLocked = data.status === 'locked';
    const isMastered = data.status === 'mastered' || data.mastery_score >= 0.9;
    const isInProgress = !isLocked && !isMastered;

    // Determine colors based on status and mastery
    let borderColor = 'border-slate-700/50';
    let bgColor = 'bg-slate-900/60';
    let shadowColor = '';
    let iconColor = 'text-slate-400';

    if (isMastered) {
        borderColor = 'border-emerald-500/50';
        bgColor = 'bg-emerald-950/40';
        shadowColor = 'shadow-[0_0_15px_rgba(16,185,129,0.2)]';
        iconColor = 'text-emerald-400';
    } else if (isInProgress) {
        // Map mastery score (0-0.89) to a color. E.g., low is orange, high is blue.
        if (data.mastery_score < 0.4) {
            borderColor = 'border-amber-500/50';
            bgColor = 'bg-amber-950/40';
            shadowColor = 'shadow-[0_0_15px_rgba(245,158,11,0.2)]';
            iconColor = 'text-amber-400';
        } else {
            borderColor = 'border-blue-500/50';
            bgColor = 'bg-blue-950/40';
            shadowColor = 'shadow-[0_0_15px_rgba(59,130,246,0.2)]';
            iconColor = 'text-blue-400';
        }
    } else if (isLocked) {
        borderColor = 'border-slate-800/80';
        bgColor = 'bg-slate-950/80';
        iconColor = 'text-slate-600';
    }

    return (
        <div
            className={cn(
                'relative px-4 py-3 rounded-xl min-w-[180px]',
                'backdrop-blur-md border transition-all duration-300',
                borderColor,
                bgColor,
                shadowColor,
                selected ? 'ring-2 ring-white/20 scale-105' : 'hover:scale-105 hover:bg-slate-800/80',
                isLocked ? 'opacity-80 grayscale-[50%]' : ''
            )}>
            {/* Top handles for incoming dependencies */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-slate-700 border-2 border-slate-950"
            />

            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {isLocked ? (
                            <Lock className={cn("w-4 h-4", iconColor)} />
                        ) : isMastered ? (
                            <CheckCircle className={cn("w-4 h-4", iconColor)} />
                        ) : (
                            <BookOpen className={cn("w-4 h-4", iconColor)} />
                        )}
                        <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">
                            {data.type.replace('_', ' ')}
                        </span>
                    </div>
                    <h3 className={cn("font-semibold leading-tight", isLocked ? "text-slate-500" : "text-slate-100")}>
                        {data.label}
                    </h3>
                </div>

                {!isLocked && (
                    <div className="flex flex-col items-end">
                        <div className="text-xs font-bold text-slate-300">
                            {Math.round(data.mastery_score * 100)}%
                        </div>
                        <div className="text-[10px] text-slate-500">Mastery</div>
                    </div>
                )}
            </div>

            {!isLocked && (
                <div className="mt-3 w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                    <div
                        className={cn("h-full rounded-full", isMastered ? "bg-emerald-500" : (data.mastery_score < 0.4 ? "bg-amber-500" : "bg-blue-500"))}
                        style={{ width: `${Math.max(5, data.mastery_score * 100)}%` }}
                    />
                </div>
            )}

            {/* Bottom handles for outgoing dependencies */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-slate-700 border-2 border-slate-950"
            />
        </div>
    );
}

export default memo(ConceptNode);
