import { Card } from '@/components/ui/card';
import PDFUpload from '../features/pdf/PDFUpload';

interface WorkspaceEmptyStateProps {
    onUploadSuccess: (fileId: string) => void;
}

export function WorkspaceEmptyState({ onUploadSuccess }: WorkspaceEmptyStateProps) {
    return (
        <Card className="flex-1 glass-card rounded-3xl overflow-hidden flex items-center justify-center p-6 border-slate-800/20">
            <PDFUpload onUploadSuccess={onUploadSuccess} />
        </Card>
    );
}
