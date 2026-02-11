import { useState } from "react";

export default function PDFUpload({ onUploadSuccess }: { onUploadSuccess: (fileId: string) => void }) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      onUploadSuccess(data.file_id);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Помилка завантаження файлу.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
      <div className="text-4xl mb-4 text-blue-400">📄</div>
      <h3 className="text-xl font-semibold mb-2 text-white">Завантажте навчальні матеріали</h3>
      <p className="text-slate-400 mb-6 text-center">PDF файли будуть проаналізовані для створення бази знань</p>
      
      <label className={`cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {loading ? 'Обробка...' : 'Вибрати PDF'}
        <input 
          type="file" 
          accept=".pdf" 
          className="hidden" 
          onChange={handleFileChange}
          disabled={loading}
        />
      </label>
    </div>
  );
}
