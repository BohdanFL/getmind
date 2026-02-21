import { useState, useEffect } from 'react'
import Chat from "./components/Chat";
import PDFUpload from "./components/PDFUpload";
// import PdfViewer from "./components/PdfViewer";


function App() {
  const [fileId, setFileId] = useState<string | null>(null);

  // Check for existing (cached) session on mount
  useEffect(() => {
    const checkDefaultSession = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/upload/status/default`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "completed") {
            setFileId("default");
          }
        }
      } catch (error) {
        // Silently fail if no default session
        console.log("No default session found on startup.", error);
      }
    };
    checkDefaultSession();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col font-sans">
      <header className="max-w-7xl w-full mx-auto mb-10 flex shrink-0 justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Get<span className="text-blue-500">Mind</span>
          </h1>
          <p className="text-slate-400 mt-2">Екосистема для глибокого засвоєння знань</p>
        </div>
        <div className="flex space-x-4">
          <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 text-sm">
            Status: <span className="text-emerald-400">Online</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-[500px] mb-12">
        {/* Left Panel: Content / Upload */}
        <div className="lg:col-span-7 flex flex-col space-y-4 h-[calc(100vh-250px)]">
          {!fileId ? (
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-6">
               <PDFUpload onUploadSuccess={(id) => setFileId(id)} />
            </div>
          ) : (
            <PdfViewer fileId={fileId} onReset={() => setFileId(null)} />
          )}
          
          <div className="h-32 bg-slate-900 border border-slate-800 rounded-xl p-4 shrink-0">
            <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-2">Cognitive Progress</h4>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full w-[10%]"></div>
            </div>
            <p className="text-xs mt-2 text-slate-400">10% of material processed</p>
          </div>
        </div>

        {/* Right Panel: Chat */}
        <div className="lg:col-span-5 h-full min-h-[400px]">
          <Chat fileId={fileId} />
        </div>
      </div>
    </main>
  );
}

export default App
