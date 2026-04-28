import Chat from './components/features/chat/Chat';
import PdfViewer from './components/features/pdf/PdfViewer';
import { useAppSession } from './hooks/useAppSession';
import { RetrievalStrengthCard } from './components/features/dashboard/RetrievalStrengthCard';
import { MainContainer } from './components/layout/MainContainer';
import { ContentGrid } from './components/layout/ContentGrid';
import { MainContentArea } from './components/layout/MainContentArea';
import { SidebarArea } from './components/layout/SidebarArea';
import { WorkspaceEmptyState } from './components/layout/WorkspaceEmptyState';

function App() {
    const { 
        fileId, 
        highlights, 
        currentPage, 
        setFileId, 
        setCurrentPage, 
        actions 
    } = useAppSession();

    return (
        <MainContainer>
            <ContentGrid>
                <MainContentArea>
                    {!fileId ? (
                        <WorkspaceEmptyState onUploadSuccess={setFileId} />
                    ) : (
                        <PdfViewer
                            fileId={fileId}
                            onReset={actions.resetSession}
                            highlights={highlights}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </MainContentArea>

                <SidebarArea>
                    <div className="flex-1 min-h-0">
                        <Chat
                            fileId={fileId}
                            onHighlight={actions.addHighlight}
                            onClearHighlights={actions.resetSession}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                    <RetrievalStrengthCard />
                </SidebarArea>
            </ContentGrid>
        </MainContainer>
    );
}

export default App;
