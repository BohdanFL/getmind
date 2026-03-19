import { useState, useRef, useEffect, useMemo } from 'react';
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

interface Highlight {
    page: number;
    box: {
        ymin: number;
        xmin: number;
        ymax: number;
        xmax: number;
    };
    label?: string;
}

interface PdfViewerProps {
    fileId: string;
    onReset: () => void;
    highlights?: Highlight[];
    currentPage: number;
    onPageChange: (page: number) => void;
}

const HighlightOverlay = ({ highlights, pageNumber }: { highlights: Highlight[], pageNumber: number }) => {
    const pageHighlights = highlights.filter(h => h.page === pageNumber);
    
    if (pageHighlights.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-30">
            {pageHighlights.map((h, i) => (
                <div 
                    key={i}
                    className="absolute bg-yellow-400/30 border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)] rounded-sm"
                    style={{
                        top: `${h.box.ymin / 10}%`,
                        left: `${h.box.xmin / 10}%`,
                        width: `${(h.box.xmax - h.box.xmin) / 10}%`,
                        height: `${(h.box.ymax - h.box.ymin) / 10}%`,
                    }}
                >
                    {h.label && (
                        <div className="absolute -top-5 left-0 bg-yellow-500 text-white text-[8px] px-1 py-0.5 rounded-sm font-bold uppercase tracking-tighter shadow-lg">
                            {h.label}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const PdfViewer = ({ fileId, onReset, highlights = [], currentPage, onPageChange }: PdfViewerProps) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [scale, setScale] = useState(1.0);
    const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<{[key: number]: HTMLDivElement | null}>({});
    const isScrollingRef = useRef(false);

    const pdfUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/pdf/${fileId}`;

    // Update pageRefs when numPages changes
    const pagesList = useMemo(() => {
        return Array.from({ length: numPages || 0 }, (_, i) => i + 1);
    }, [numPages]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    // Scroll to page when external currentPage changes
    useEffect(() => {
        // If the change was triggered by our own scrolling, don't scroll back
        if (isScrollingRef.current) return;

        const pageEl = pageRefs.current[currentPage];
        if (pageEl) {
            const rect = pageEl.getBoundingClientRect();
            const containerRect = scrollContainerRef.current?.getBoundingClientRect();
            
            if (containerRect) {
                // Large tolerance: only scroll if the page is truly far away
                const tolerance = 100; 
                const isSignificantlyVisible = 
                    rect.top >= (containerRect.top - tolerance) && 
                    rect.top <= (containerRect.bottom - tolerance);

                if (!isSignificantlyVisible) {
                    pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    }, [currentPage]);

    // Track visible page while scrolling
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !numPages) return;

        const observer = new IntersectionObserver(
            (entries) => {
                setVisiblePages(prev => {
                    const next = new Set(prev);
                    entries.forEach(entry => {
                        const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '0');
                        if (entry.isIntersecting) {
                            next.add(pageNum);
                        }
                    });
                    return next;
                });

                // Update current page for the header
                const topVisible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                
                if (topVisible) {
                    const pageNum = parseInt(topVisible.target.getAttribute('data-page-number') || '1');
                    // Only update if it's a different page to avoid constant state updates
                    if (pageNum !== currentPage) {
                        // Use a separate flag to know this was a scroll-triggered change
                        isScrollingRef.current = true;
                        onPageChange(pageNum);
                        // Reset the flag after a short delay
                        setTimeout(() => { isScrollingRef.current = false; }, 100);
                    }
                }
            },
            {
                root: container,
                rootMargin: '2000px', // Pre-load ~5-10 pages around the viewport
                threshold: [0.01, 0.5]
            }
        );

        Object.values(pageRefs.current).forEach(ref => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [numPages, onPageChange]);

    const goToPrevPage = () => {
        const prev = Math.max(currentPage - 1, 1);
        onPageChange(prev);
    };

    const goToNextPage = () => {
        const next = Math.min(currentPage + 1, numPages || 1);
        onPageChange(next);
    };
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
                            disabled={currentPage <= 1}
                            onClick={goToPrevPage}
                            className="h-7 w-7 text-slate-400 hover:text-neon-blue hover:bg-transparent disabled:opacity-30"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <span className="text-[10px] font-mono font-bold text-slate-400 min-w-[60px] text-center tracking-tighter">
                            PAGE {currentPage} <span className="text-slate-600">/</span> {numPages || '--'}
                        </span>
                        <Button 
                            variant="ghost"
                            size="icon"
                            disabled={currentPage >= (numPages || 1)}
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

            <ScrollArea 
                ref={scrollContainerRef}
                className="flex-1 bg-slate-950/40 p-6 scroll-smooth"
            >
                <div className="flex flex-col items-center space-y-8 min-w-min mx-auto pb-20">
                    {pdfUrl ? (
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
                            {pagesList.map((pageNum) => (
                                <div 
                                    key={pageNum}
                                    ref={el => pageRefs.current[pageNum] = el}
                                    data-page-number={pageNum}
                                    className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden border border-slate-800/50 bg-white min-h-[500px]"
                                >
                                    {visiblePages.has(pageNum) && (
                                        <>
                                            <Page 
                                                pageNumber={pageNum} 
                                                scale={scale}
                                                renderTextLayer={true}
                                                renderAnnotationLayer={true}
                                                loading={
                                                    <div className="flex items-center justify-center min-h-[400px] w-full bg-slate-900/10">
                                                        <Loader2 className="w-6 h-6 text-slate-700 animate-spin" />
                                                    </div>
                                                }
                                            />
                                            <HighlightOverlay 
                                                highlights={highlights} 
                                                pageNumber={pageNum} 
                                            />
                                        </>
                                    )}
                                </div>
                            ))}
                        </Document>
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
