import { useState, useEffect } from 'react';

export function useAppSession() {
    const [fileId, setFileId] = useState<string | null>(null);
    const [highlights, setHighlights] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

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

    const resetSession = () => {
        setFileId(null);
        setHighlights([]);
        setCurrentPage(1);
    };

    const addHighlight = (h: any) => {
        setHighlights((prev) => [...prev, h]);
        if (h.page) setCurrentPage(h.page);
    };

    return {
        fileId,
        highlights,
        currentPage,
        setFileId,
        setHighlights,
        setCurrentPage,
        actions: {
            resetSession,
            addHighlight,
        },
    };
}
