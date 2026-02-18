import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  fileId: string | null;
}

export default function Chat({ fileId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Вітаю! Я твій **Сократівський тьютор**. Що ми сьогодні будемо досліджувати?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Initial assistant message for streaming
    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/chat`;
      console.log(">>> [FRONTEND] Sending request to:", apiUrl);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input, 
          history: messages.slice(-10), // Send last 10 messages for context
          file_id: fileId 
        })
      });
      
      if (!response.body) throw new Error("No body in response");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      setLoading(false);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        
        // Update the last message (the assistant's message) in real-time
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: "assistant", content: assistantContent };
          return newMsgs;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: "assistant", content: "Вибач, сталася помилка з'єднання." };
        return newMsgs;
      });
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
        {messages.map((msg, i) => (msg.content && (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl ${
              msg.role === "user" 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none"
            }`}>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-slate-800 text-slate-400 p-3 rounded-2xl rounded-tl-none border border-slate-700 italic text-sm">
                Тьютор роздумує...
             </div>
          </div>
        )}
        <div className="pb-4" /> {/* Extra space at the bottom of messages */}
      </div>

      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
