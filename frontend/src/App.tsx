import { useState } from 'react'
import Chat from "./components/Chat";
import PDFUpload from "./components/PDFUpload";

function App() {
  const [fileId, setFileId] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Cogni<span className="text-blue-500">Flow</span>
          </h1>
          <p className="text-slate-400 mt-2">Екосистема для глибокого засвоєння знань</p>
        </div>
        <div className="flex space-x-4">
          <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 text-sm">
            Status: <span className="text-emerald-400">Online</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-200px)]">
        {/* Left Panel: Content / Upload */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-6">
            {!fileId ? (
              <PDFUpload onUploadSuccess={(id) => setFileId(id)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 italic">
                PDF Viewer (Coming Soon) - File ID: {fileId}
              </div>
            )}
          </div>
          <div className="h-32 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-2">Cognitive Progress</h4>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full w-[10%]"></div>
            </div>
            <p className="text-xs mt-2 text-slate-400">10% of material processed</p>
          </div>
        </div>

        {/* Right Panel: Chat */}
        <div className="lg:col-span-5 h-full">
          <Chat />
        </div>
      </div>
    </main>
  );
}

export default App
