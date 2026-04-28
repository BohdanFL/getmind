import { useState, useRef, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Download,
    RotateCcw,
    Loader2,
} from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Highlight {
    page: number;
    box?: {
        ymin: number;
        xmin: number;
        ymax: number;
        xmax: number;
    };
    text?: string;
    label?: string;
}

interface ResolvedRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

interface PdfViewerProps {
    fileId: string;
    onReset: () => void;
    highlights?: Highlight[];
    currentPage: number;
    onPageChange: (page: number) => void;
}

const HighlightOverlay = ({
    highlights,
    pageNumber,
    resolvedRects,
}: {
    highlights: Highlight[];
    pageNumber: number;
    resolvedRects: { [key: string]: ResolvedRect[] };
}) => {
    const pageHighlights = highlights.filter((h) => h.page === pageNumber);

    if (pageHighlights.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-30">
            {pageHighlights.map((h, i) => {
                const highlightId = h.text
                    ? `${h.page}-${h.text}`
                    : `${h.page}-${h.box?.xmin}-${h.box?.ymin}`;
                const rects = h.text ? resolvedRects[highlightId] : null;

                if (h.text && !rects) return null;

                if (rects) {
                    return rects.map((r, ri) => (
                        <div
                            key={`${i}-${ri}`}
                            className="absolute bg-yellow-400/30 border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)] rounded-sm"
                            style={{
                                top: `${r.top}px`,
                                left: `${r.left}px`,
                                width: `${r.width}px`,
                                height: `${r.height}px`,
                            }}>
                            {ri === 0 && h.label && (
                                <div className="absolute -top-5 left-0 bg-yellow-500 text-white text-[8px] px-1 py-0.5 rounded-sm font-bold uppercase tracking-tighter shadow-lg">
                                    {h.label}
                                </div>
                            )}
                        </div>
                    ));
                }

                if (!h.box) return null;

                return (
                    <div
                        key={i}
                        className="absolute bg-yellow-400/30 border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)] rounded-sm"
                        style={{
                            top: `${h.box.ymin / 10}%`,
                            left: `${h.box.xmin / 10}%`,
                            width: `${(h.box.xmax - h.box.xmin) / 10}%`,
                            height: `${(h.box.ymax - h.box.ymin) / 10}%`,
                        }}>
                        {h.label && (
                            <div className="absolute -top-5 left-0 bg-yellow-500 text-white text-[8px] px-1 py-0.5 rounded-sm font-bold uppercase tracking-tighter shadow-lg">
                                {h.label}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const PdfViewer = ({
    fileId,
    onReset,
    highlights = [],
    currentPage,
    onPageChange,
}: PdfViewerProps) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [scale, setScale] = useState(1.0);
    const [pageHeights, setPageHeights] = useState<{ [key: number]: number }>(
        {},
    );
    const [internalPage, setInternalPage] = useState(1);
    const [resolvedRects, setResolvedRects] = useState<{
        [key: string]: ResolvedRect[];
    }>({});

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const pdfPages = useRef<{ [key: number]: any }>({});

    const RENDER_WINDOW = 2; // Render current ± 2 pages

    const pdfUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/pdf/${fileId}`;

    const pagesList = useMemo(() => {
        return Array.from({ length: numPages || 0 }, (_, i) => i + 1);
    }, [numPages]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    useEffect(() => {
        if (currentPage !== internalPage) {
            setInternalPage(currentPage);
            if (pageRefs.current[currentPage]) {
                pageRefs.current[currentPage]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }
        }
    }, [currentPage]);

    useEffect(() => {
        if (internalPage !== currentPage) {
            onPageChange(internalPage);
        }
    }, [internalPage]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !numPages) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.find((e) => e.isIntersecting);

                if (visible) {
                    const pageNum = parseInt(
                        visible.target.getAttribute('data-page-number') || '1',
                    );
                    if (pageNum !== internalPage) {
                        setInternalPage(pageNum);
                    }
                }
            },
            {
                root: container,
                rootMargin: '0px 0px -99% 0px',
                threshold: 0,
            },
        );

        Object.values(pageRefs.current).forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [numPages, onPageChange]);

    useEffect(() => {
        const resolveAll = async () => {
            const newResolved: { [key: string]: ResolvedRect[] } = {};

            for (const highlight of highlights) {
                if (highlight.text) {
                    const id = `${highlight.page}-${highlight.text}`;
                    const page = pdfPages.current[highlight.page];
                    if (page) {
                        const rects = await findTextRects(
                            page,
                            highlight.text,
                            scale,
                        );
                        newResolved[id] = rects;
                    }
                }
            }

            setResolvedRects(newResolved);
        };

        resolveAll();
    }, [highlights, scale, numPages]);

    const goToPrevPage = () => {
        const prev = Math.max(currentPage - 1, 1);
        onPageChange(prev);
    };

    const goToNextPage = () => {
        const next = Math.min(currentPage + 1, numPages || 1);
        onPageChange(next);
    };
    const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.0));
    const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

    const findTextRects = async (
        page: any,
        searchText: string,
        scale: number,
    ) => {
        try {
            const pageNum = page.pageNumber;
            console.log(`[DEBUG] UI Resolving Highlighting: Page ${pageNum}, Search: "${searchText}"`);
            
            const textContent = await page.getTextContent();
            const viewport = page.getViewport({ scale });
            const items = (textContent.items || []).filter(
                (item: any) =>
                    typeof item.str === 'string' &&
                    item.transform &&
                    item.transform.length === 6,
            );

            if (items.length === 0) {
                console.warn(`[DEBUG] UI Resolution Failed: No text items found on page ${pageNum}`);
                return [];
            }

            let searchable = "";
            const indexMap: { itemIdx: number; charIdx: number }[] = [];

            items.forEach((item: any, itemIdx: number) => {
                const str = item.str;
                for (let j = 0; j < str.length; j++) {
                    const lower = str[j].toLowerCase();
                    if (/[a-z0-9]/.test(lower)) {
                        searchable += lower;
                        indexMap.push({ itemIdx, charIdx: j });
                    }
                }
            });

            const normalizedSearch = searchText
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');

            console.log(`[DEBUG] UI Sub-Item Map built. Length: ${searchable.length}`);
            
            const startIndex = searchable.indexOf(normalizedSearch);
            const matchLen = normalizedSearch.length;

            if (startIndex === -1) {
                console.warn(`[DEBUG] UI Resolution Failed: Text not found in page ${pageNum} mapping.`);
                return [];
            }

            const matchSnippet = searchable.substring(startIndex, startIndex + matchLen);
            console.log(`[DEBUG] UI Match Found: "${matchSnippet}"`);

            const itemRanges: { [key: number]: { min: number; max: number } } = {};
            for (let i = startIndex; i < startIndex + matchLen; i++) {
                const { itemIdx, charIdx } = indexMap[i];
                if (!itemRanges[itemIdx]) {
                    itemRanges[itemIdx] = { min: charIdx, max: charIdx };
                } else {
                    itemRanges[itemIdx].min = Math.min(itemRanges[itemIdx].min, charIdx);
                    itemRanges[itemIdx].max = Math.max(itemRanges[itemIdx].max, charIdx);
                }
            }

            const rects: ResolvedRect[] = [];
            Object.entries(itemRanges).forEach(([idxStr, range]) => {
                const itemIdx = parseInt(idxStr);
                const item = items[itemIdx];
                const tx = pdfjs.Util.transform(viewport.transform, item.transform);
                const x = tx[4];
                const y = tx[5] - (item.height || 0) * scale;
                const w = (item.width || 0) * scale;
                const h = (item.height || 0) * scale;

                const totalChars = item.str.length;
                const ratioStart = range.min / totalChars;
                const ratioEnd = (range.max + 1) / totalChars;

                const subX = x + ratioStart * w;
                const subW = (ratioEnd - ratioStart) * w;

                if (subW > 0 && h > 0) {
                    console.log(`[DEBUG] UI Sub-Match: "${item.str.substring(range.min, range.max + 1)}" -> SubRect: [L:${subX.toFixed(1)}, W:${subW.toFixed(1)}]`);
                    rects.push({ left: subX, top: y, width: subW, height: h });
                }
            });

            console.log(`[DEBUG] UI Highlight Resolution SUCCESS: Page ${pageNum}, Found ${rects.length} rectangles.`);
            return rects;
        } catch (err) {
            console.error('[DEBUG] UI Resolution Critical Error:', err);
            return [];
        }
    };

    return (
        <Card className="flex-1 flex flex-col bg-slate-950/20 border-slate-800/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-blue/20 to-transparent z-20" />

            <div className="bg-slate-900/40 border-b border-slate-800/50 p-2.5 flex items-center justify-between z-10 backdrop-blur-xl">
                <div className="flex items-center space-x-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onReset}
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
                        title="Upload new document">
                        <RotateCcw size={16} />
                    </Button>
                    <Separator
                        orientation="vertical"
                        className="h-4 bg-slate-800/50"
                    />
                    <div className="flex items-center space-x-1 bg-slate-950/40 rounded-lg px-1 border border-slate-800/30">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={currentPage <= 1}
                            onClick={goToPrevPage}
                            className="h-7 w-7 text-slate-400 hover:text-neon-blue hover:bg-transparent disabled:opacity-30">
                            <ChevronLeft size={16} />
                        </Button>
                        <span className="text-[10px] font-mono font-bold text-slate-400 min-w-[60px] text-center tracking-tighter">
                            PAGE {currentPage}{' '}
                            <span className="text-slate-600">/</span>{' '}
                            {numPages || '--'}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={currentPage >= (numPages || 1)}
                            onClick={goToNextPage}
                            className="h-7 w-7 text-slate-400 hover:text-neon-blue hover:bg-transparent disabled:opacity-30">
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
                            className="h-7 w-7 text-slate-400 hover:text-neon-blue hover:bg-transparent">
                            <ZoomOut size={16} />
                        </Button>
                        <span className="text-[9px] font-mono font-bold text-slate-500 w-10 text-center tracking-tighter">
                            {Math.round(scale * 100)}%
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={zoomIn}
                            className="h-7 w-7 text-slate-400 hover:text-neon-blue hover:bg-transparent">
                            <ZoomIn size={16} />
                        </Button>
                    </div>
                    <Separator
                        orientation="vertical"
                        className="h-4 bg-slate-800/50"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all">
                        <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Save document">
                            <Download size={16} />
                        </a>
                    </Button>
                </div>
            </div>

            <ScrollArea
                ref={scrollContainerRef}
                className="flex-1 bg-slate-900 scroll-smooth">
                <div className="flex flex-col items-center space-y-[4px] min-w-min mx-auto pb-40">
                    {pdfUrl ? (
                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                                    <Loader2 className="w-10 h-10 text-neon-blue animate-spin" />
                                    <p className="text-[10px] font-mono font-bold text-slate-500 tracking-[0.2em]">
                                        INITIALIZING_READER...
                                    </p>
                                </div>
                            }
                            error={
                                <div className="p-10 text-rose-400 text-center bg-rose-500/5 rounded-xl border border-rose-500/20">
                                    Failed to decode neural data stream.
                                </div>
                            }>
                            {pagesList.map((pageNum) => {
                                const isVisible =
                                    Math.abs(pageNum - internalPage) <=
                                    RENDER_WINDOW;
                                const height = pageHeights[pageNum];

                                return (
                                    <div
                                        key={pageNum}
                                        ref={(el) => {
                                            pageRefs.current[pageNum] = el;
                                        }}
                                        data-page-number={pageNum}
                                        style={{
                                            minHeight: height
                                                ? `${height}px`
                                                : '800px',
                                            scrollMarginTop: '10px',
                                        }}
                                        className="relative overflow-hidden bg-white border-b border-slate-200/10 last:border-0 w-full flex justify-center">
                                        {isVisible && (
                                            <>
                                                <Page
                                                    pageNumber={pageNum}
                                                    scale={scale}
                                                    renderTextLayer={true}
                                                    renderAnnotationLayer={true}
                                                    onLoadSuccess={async (
                                                        page,
                                                    ) => {
                                                        const h = Math.ceil(
                                                            page.view[3] *
                                                                scale,
                                                        );
                                                        if (
                                                            pageHeights[
                                                                pageNum
                                                            ] !== h
                                                        ) {
                                                            setPageHeights(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [pageNum]:
                                                                        h,
                                                                }),
                                                            );
                                                        }

                                                        pdfPages.current[
                                                            pageNum
                                                        ] = page;

                                                        const pageHighlights =
                                                            highlights.filter(
                                                                (h) =>
                                                                    h.page ===
                                                                        pageNum &&
                                                                    h.text,
                                                            );
                                                        if (
                                                            pageHighlights.length >
                                                            0
                                                        ) {
                                                            for (const h of pageHighlights) {
                                                                const searchText =
                                                                    h.text;
                                                                if (
                                                                    searchText
                                                                ) {
                                                                    const id = `${h.page}-${searchText}`;
                                                                    const rects =
                                                                        await findTextRects(
                                                                            page,
                                                                            searchText,
                                                                            scale,
                                                                        );
                                                                    setResolvedRects(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [id]: rects,
                                                                        }),
                                                                    );
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    loading={
                                                        <div className="flex items-center justify-center min-h-[400px] w-full bg-slate-900/10">
                                                            <Loader2 className="w-6 h-6 text-slate-700 animate-spin" />
                                                        </div>
                                                    }
                                                />
                                                <HighlightOverlay
                                                    highlights={highlights}
                                                    pageNumber={pageNum}
                                                    resolvedRects={
                                                        resolvedRects
                                                    }
                                                />
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </Document>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                                <RotateCcw className="animate-spin-slow" />
                            </div>
                            <p className="text-[10px] font-mono tracking-widest uppercase">
                                Waiting for document stream...
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
};

export default PdfViewer;
