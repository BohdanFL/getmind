import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, RotateCcw, Loader2 } from "lucide-react";

// Set up worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
    fileId: string;
    onReset: () => void;
}

const PdfViewer = ({ fileId, onReset }: PdfViewerProps) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);

    const pdfUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/pdf/${fileId}`;

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
    const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));
    const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.0));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

    return (
        <Card className="flex-1 flex flex-col bg-slate-950/20 border-slate-800/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Context Header for the viewer */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-blue/20 to-transparent z-20" />
            
            <div className="bg-slate-900/40 border-b border-slate-800/50 p-2.5 flex items-center justify-between z-10 backdrop-blur-xl">
                <div className="flex items-center space-x-3">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={onReset}
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
                        title="Upload new document"
                    >
                         <RotateCcw size={16} />
                    </Button>
                    <Separator orientation="vertical" className="h-4 bg-slate-800/50" />
                    <div className="flex items-center space-x-1 bg-slate-950/40 rounded-lg px-1 border border-slate-800/30">
                         <Button 
                            variant="ghost"
                            size="icon"
                            disabled={pageNumber <= 1}
                            onClick={goToPrevPage}
                            className="h-7 w-7 text-slate-400 hover:text-neon-blue hover:bg-transparent disabled:opacity-30"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <span className="text-[10px] font-mono font-bold text-slate-400 min-w-[60px] text-center tracking-tighter">
                            PAGE {pageNumber} <span className="text-slate-600">/</span> {numPages || '--'}
                        </span>
                        <Button 
                            variant="ghost"
                            size="icon"
                            disabled={pageNumber >= (numPages || 1)}
                            onClick={goToNextPage}
                            className="h-7 w-7 text-slate-400 hover:text-neon-blue hover:bg-transparent disabled:opacity-30"
                        >
                             <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-slate-950/40 rounded-lg px-1 border border-slate-800/30">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={zoomOut} 
                            className="h-7 w-7 text-slate-400 hover:text-neon-blue hover:bg-transparent"
                        >
                            <ZoomOut size={16} />
                        </Button>
                        <span className="text-[9px] font-mono font-bold text-slate-500 w-10 text-center tracking-tighter">
                            {Math.round(scale * 100)}%
                        </span>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={zoomIn} 
                            className="h-7 w-7 text-slate-400 hover:text-neon-blue hover:bg-transparent"
                        >
                            <ZoomIn size={16} />
                        </Button>
                    </div>
                    <Separator orientation="vertical" className="h-4 bg-slate-800/50" />
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        asChild
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
                    >
                        <a 
                            href={pdfUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title="Save document"
                        >
                            <Download size={16} />
                        </a>
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 bg-slate-950/40 p-6">
                <div className="flex justify-center min-w-min mx-auto">
                    {pdfUrl ? (
                         <div className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden border border-slate-800/50">
                            <Document
                                file={pdfUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={
                                    <div className="flex flex-col items-center justify-center p-20 space-y-4">
                                        <Loader2 className="w-10 h-10 text-neon-blue animate-spin" />
                                        <p className="text-[10px] font-mono font-bold text-slate-500 tracking-[0.2em]">INITIALIZING_READER...</p>
                                    </div>
                                }
                                error={
                                    <div className="p-10 text-rose-400 text-center bg-rose-500/5 rounded-xl border border-rose-500/20">
                                        Failed to decode neural data stream.
                                    </div>
                                }
                            >
                                <Page 
                                    pageNumber={pageNumber} 
                                    scale={scale}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                />
                            </Document>
                         </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                             <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                                <RotateCcw className="animate-spin-slow" />
                             </div>
                             <p className="text-[10px] font-mono tracking-widest uppercase">Waiting for document stream...</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
};

export default PdfViewer;
