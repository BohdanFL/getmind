import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  fileId: string | null;
}

export default function Chat({ fileId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Вітаю! Я твій Сократівський тьютор. Що ми сьогодні будемо досліджувати?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input, 
          history: messages,
          file_id: fileId // Send fileId to backend
        })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Вибач, сталася помилка з'єднання." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white rounded-lg shadow-xl overflow-hidden border border-slate-700">
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Socratic Tutor
        </h2>
        {fileId && <span className="text-xs text-emerald-400">Context Active ({fileId.slice(0,4)}...)</span>}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${
              msg.role === "user" 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-slate-700 text-slate-100 rounded-tl-none"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-slate-500 italic">Тьютор думає...</div>}
      </div>

      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Запитай щось..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Надіслати
          </button>
        </div>
      </div>
    </div>
  );
}
