import React from 'react';
import { Brain, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { BloomMastery } from '../BloomMastery';
import { CognitiveLoadIndicator } from '../dashboard/CognitiveLoadIndicator';

export function AppHeader() {
    return (
        <header className="max-w-[1600px] w-full mx-auto mb-8 flex shrink-0 items-start justify-between relative z-10">
            <div className="flex flex-col">
                <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-electric-violet rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                        <Brain size={24} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-gradient">
                        GETMIND<span className="text-blue-500">.</span>
                    </h1>
                </div>
                <div className="flex items-center space-x-3">
                    <Badge
                        variant="outline"
                        className="px-2 py-0.5 bg-slate-900/50 border-slate-800 text-[10px] font-mono text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyber-emerald mr-2 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        NEURAL LINK ACTIVE
                    </Badge>
                    <Link to="/graph-test">
                        <Badge variant="outline" className="px-2 py-0.5 bg-blue-900/30 border-blue-800 text-blue-400 text-[10px] font-mono cursor-pointer hover:bg-blue-800/50 transition-colors flex items-center gap-1">
                            <Share2 size={10} />
                            KG TEST
                        </Badge>
                    </Link>
                </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-2xl px-12">
                <BloomMastery />
            </div>

            <div className="flex items-center space-x-4">
                <CognitiveLoadIndicator level={3} />
            </div>
        </header>
    );
}
