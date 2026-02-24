import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

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
        <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative">
            {/* Toolbar */}
            <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between z-10">
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={onReset}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Завантажити інший файл"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="h-4 w-[1px] bg-slate-700"></div>
                    <div className="flex items-center space-x-2">
                         <button 
                            disabled={pageNumber <= 1}
                            onClick={goToPrevPage}
                            className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <span className="text-xs font-mono text-slate-300 min-w-[60px] text-center">
                            {pageNumber} / {numPages || '--'}
                        </span>
                        <button 
                            disabled={pageNumber >= (numPages || 1)}
                            onClick={goToNextPage}
                            className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 transition-colors"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button onClick={zoomOut} className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <span className="text-[10px] font-mono text-slate-500 w-10 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button onClick={zoomIn} className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>
                    <a 
                        href={pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
                        title="Зберегти PDF"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </a>
                </div>
            </div>

            {/* Viewer Area */}
            <div className="flex-1 overflow-auto p-4 flex justify-center bg-slate-950 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                            <p className="text-sm font-medium">Підготовка документа...</p>
                        </div>
                    }
                    error={
                        <div className="text-red-400 text-sm p-10 text-center">
                            Помилка завантаження PDF. Спробуйте оновити сторінку.
                        </div>
                    }
                >
                    <Page 
                        pageNumber={pageNumber} 
                        scale={scale} 
                        className="shadow-2xl shadow-black ring-1 ring-slate-800"
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                    />
                </Document>
            </div>
        </div>
    );
};

export default PdfViewer;
