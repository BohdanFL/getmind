import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileUp, Loader2 } from "lucide-react";

interface ProcessingStatus {
  status: string;
  progress: number;
  message: string;
}

export default function PDFUpload({ onUploadSuccess }: { onUploadSuccess: (fileId: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [progressStatus, setProgressStatus] = useState<ProcessingStatus | null>(null);

  const startPolling = (fileId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/upload/status/${fileId}`);
        const data: ProcessingStatus = await response.json();
        
        setProgressStatus(data);
        
        if (data.status === "completed") {
          clearInterval(interval);
          setLoading(false);
          onUploadSuccess(fileId);
        } else if (data.status === "error") {
          clearInterval(interval);
          setLoading(false);
          alert(data.message);
        }
      } catch (error) {
        console.error("Polling error:", error);
        clearInterval(interval);
        setLoading(false);
      }
    }, 1000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setLoading(true);
    setProgressStatus({ status: "uploading", progress: 5, message: "Завантаження файлу на сервер..." });
    
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      startPolling(data.file_id);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Помилка завантаження файлу.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <Card className="w-full max-w-xl bg-slate-900/40 border-slate-800/50 border-2 border-dashed backdrop-blur-md rounded-3xl transition-all hover:border-neon-blue/40 group overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center relative">
          {/* Background Highlight */}
          <div className="absolute inset-0 bg-neon-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          {!loading ? (
            <>
              <div className="w-20 h-20 bg-neon-blue/10 rounded-2xl flex items-center justify-center mb-8 text-neon-blue shadow-lg shadow-neon-blue/5 group-hover:scale-110 transition-transform duration-500">
                <FileUp size={40} />
              </div>
              <CardHeader className="p-0 mb-8 max-w-sm">
                <CardTitle className="text-2xl font-black text-white mb-3 tracking-tight">
                  NEURAL DATA INPUT
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium leading-relaxed">
                  Upload your PDF materials to synchronize them with the cognitive engine.
                </CardDescription>
              </CardHeader>
              
              <Button
                asChild
                className="bg-neon-blue hover:bg-neon-blue/80 text-white px-10 h-14 rounded-2xl transition-all shadow-xl shadow-neon-blue/20 font-bold tracking-widest text-xs"
              >
                <label className="cursor-pointer">
                  SELECT PDF
                  <input 
                    type="file" 
                    accept=".pdf" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </label>
              </Button>
            </>
          ) : (
            <div className="w-full space-y-10 py-6 relative z-10">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Loader2 className="w-20 h-20 text-neon-blue animate-spin opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-xs font-black text-white font-mono">
                       {progressStatus?.progress || 0}%
                     </span>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-300 mt-6 tracking-[0.2em] uppercase">
                  {progressStatus?.message || "SYNCHRONIZING..."}
                </h3>
              </div>
              
              <div className="space-y-4 max-w-sm mx-auto w-full">
                <div className="flex justify-between text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest">
                  <span>
                    {progressStatus?.status === 'vectorizing' ? 'VECTOR_INDEXING' : 'DATA_UPLOAD'}
                  </span>
                  <span className="text-neon-blue">{progressStatus?.progress || 0}%</span>
                </div>
                <Progress value={progressStatus?.progress || 0} className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/30" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
