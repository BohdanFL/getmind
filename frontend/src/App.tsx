import { useState, useEffect } from 'react';
import Chat from './components/Chat';
import PDFUpload from './components/PDFUpload';
import PdfViewer from './components/PdfViewer';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BloomMastery } from './components/BloomMastery';
import { Zap, Activity, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

function App() {
    const [fileId, setFileId] = useState<string | null>(null);
    const [highlights, setHighlights] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    // Check for existing (cached) session on mount
    useEffect(() => {
        const checkDefaultSession = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/upload/status/default`,
                );
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'completed') {
                        setFileId('default');
                    }
                }
            } catch (error) {
                console.log('No default session found on startup.', error);
            }
        };
        checkDefaultSession();
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 flex flex-col font-sans selection:bg-neon-blue/30 overflow-hidden relative">
            {/* Neural Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[140px] animate-pulse" />
                <div
                    className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[50%] bg-electric-violet/5 rounded-full blur-[140px] animate-pulse"
                    style={{ animationDelay: '1s' }}
                />
            </div>

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
                    </div>
                </div>

                {/* <div className="hidden md:flex flex-1 max-w-2xl px-12">
           <BloomMastery />
        </div> */}
                {/* 
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-end space-y-1">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cognitive Load</span>
             <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={cn("w-1.5 h-3 rounded-sm", i <= 3 ? "bg-blue-500" : "bg-slate-800")} />
                ))}
             </div>
          </div>
        </div>
       */}
            </header>
            <div className="max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 relative z-10 min-h-0">
                {/* Left Panel: Content / Upload */}
                <div className="lg:col-span-8 flex flex-col space-y-4 h-[calc(100vh-180px)]">
                    {!fileId ? (
                        <Card className="flex-1 glass-card rounded-3xl overflow-hidden flex items-center justify-center p-6 border-slate-800/20">
                            <PDFUpload
                                onUploadSuccess={(id) => setFileId(id)}
                            />
                        </Card>
                    ) : (
                        <PdfViewer
                            fileId={fileId}
                            onReset={() => {
                                setFileId(null);
                                setHighlights([]);
                                setCurrentPage(1);
                            }}
                            highlights={highlights}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>

                {/* Right Panel: Chat & Meta */}
                <div className="lg:col-span-4 flex flex-col space-y-4 h-[calc(100vh-180px)]">
                    <div className="flex-1 min-h-0">
                        <Chat 
                            fileId={fileId} 
                            onHighlight={(h) => {
                                setHighlights(prev => [...prev, h]);
                                if (h.page) setCurrentPage(h.page);
                            }}
                            onClearHighlights={() => setHighlights([])}
                            onPageChange={setCurrentPage}
                        />
                    </div>

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
                                value={45}
                                className="h-1.5 bg-slate-800/50 overflow-hidden"
                            />
                            <div className="flex justify-between mt-3 text-[10px] font-medium text-slate-400 font-mono">
                                <div className="flex items-center">
                                    <Zap
                                        size={10}
                                        className="mr-1 text-blue-500"
                                    />
                                    <span>STABILITY: 88%</span>
                                </div>
                                <span>NEXT RECALL: 4h 20m</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </main>
    );
}

export default App;
