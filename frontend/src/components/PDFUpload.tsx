import { useState } from "react";

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
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors w-full max-w-lg mx-auto">
      {!loading ? (
        <>
          <div className="text-4xl mb-4 text-blue-400">📄</div>
          <h3 className="text-xl font-semibold mb-2 text-white">Завантажте навчальні матеріали</h3>
          <p className="text-slate-400 mb-6 text-center">PDF файли будуть проаналізовані для створення бази знань</p>
          
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95">
            Вибрати PDF
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </label>
        </>
      ) : (
        <div className="w-full space-y-6 py-4">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-medium text-white">{progressStatus?.message || "Обробка..."}</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{progressStatus?.status === 'vectorizing' ? 'Ембединг моделі' : 'Обробка'}</span>
              <span>{progressStatus?.progress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                style={{ width: `${progressStatus?.progress || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
