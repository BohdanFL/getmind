import { useState } from "react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UseChatLogicProps {
  fileId: string | null;
  onHighlight?: (highlight: any) => void;
  onClearHighlights?: () => void;
  onPageChange?: (page: number) => void;
}

export function useChatLogic({ fileId, onHighlight, onClearHighlights, onPageChange }: UseChatLogicProps) {
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

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages(prev => [...prev, assistantMsg]);
    onClearHighlights?.();

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/chat`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input, 
          history: messages.slice(-10),
          file_id: fileId 
        })
      });
      
      if (!response.body) throw new Error("No body in response");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let started = false;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (!started) {
          started = true;
          setLoading(false);
        }

        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        const hlTextRegex = /\[\[HL_TEXT:(\d+),"([^"]+)"\]\]/g;
        const hlTextMatches = Array.from(assistantContent.matchAll(hlTextRegex));
        for (const match of hlTextMatches) {
          const [full, page, text] = match;
          console.log(`[DEBUG] AI Highlight (Text): Page ${page}, Content: "${text}"`);
          onHighlight?.({
            page: parseInt(page),
            text: text,
          });
          assistantContent = assistantContent.replace(full, "");
        }

        const hlRegex = /\[\[HL:(\d+),(\d+),(\d+),(\d+),(\d+)\]\]/g;
        const hlMatches = Array.from(assistantContent.matchAll(hlRegex));
        for (const match of hlMatches) {
          const [full, page, ymin, xmin, ymax, xmax] = match;
          console.log(`[DEBUG] AI Highlight (Box): Page ${page}, Coordinates: [${ymin}, ${xmin}, ${ymax}, ${xmax}]`);
          onHighlight?.({
            page: parseInt(page),
            box: {
              ymin: parseInt(ymin),
              xmin: parseInt(xmin),
              ymax: parseInt(ymax),
              xmax: parseInt(xmax)
            }
          });
          assistantContent = assistantContent.replace(full, "");
        }

        const pageRegex = /\[\[PAGE:(\d+)\]\]/g;
        let pageMatch;
        while ((pageMatch = pageRegex.exec(assistantContent)) !== null) {
          const [full, page] = pageMatch;
          onPageChange?.(parseInt(page));
          assistantContent = assistantContent.replace(full, "");
        }
        
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

  return {
    messages,
    input,
    setInput,
    loading,
    sendMessage
  };
}
