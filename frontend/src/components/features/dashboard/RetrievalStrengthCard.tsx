import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Zap } from 'lucide-react';

interface RetrievalStrengthCardProps {
    stability?: string;
    nextRecall?: string;
    value?: number;
}

export function RetrievalStrengthCard({
    stability = '88%',
    nextRecall = '4h 20m',
    value = 45,
}: RetrievalStrengthCardProps) {
    return (
        <Card className="h-32 glass-card rounded-2xl p-5 border-slate-800/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity size={48} className="text-blue-400" />
            </div>
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                        Retrieval Strength (SRS)
                    </h4>
                    <Badge
                        variant="outline"
                        className="text-[9px] h-4 border-blue-500/30 text-blue-400 font-mono">
                        OPTIMAL
                    </Badge>
                </div>
                <Progress
                    value={value}
                    className="h-1.5 bg-slate-800/50 overflow-hidden"
                />
                <div className="flex justify-between mt-3 text-[10px] font-medium text-slate-400 font-mono">
                    <div className="flex items-center">
                        <Zap size={10} className="mr-1 text-blue-500" />
                        <span>STABILITY: {stability}</span>
                    </div>
                    <span>NEXT RECALL: {nextRecall}</span>
                </div>
            </div>
        </Card>
    );
}
