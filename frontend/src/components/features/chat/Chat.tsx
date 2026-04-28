import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useChatLogic } from "./hooks/useChatLogic";

interface ChatProps {
  fileId: string | null;
  onHighlight?: (highlight: any) => void;
  onClearHighlights?: () => void;
  onPageChange?: (page: number) => void;
}

export default function Chat(props: ChatProps) {
  const { messages, input, setInput, loading, sendMessage } = useChatLogic(props);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <Card className="flex flex-col h-full bg-slate-900/40 border-slate-800/50 backdrop-blur-md shadow-2xl overflow-hidden text-slate-100 rounded-3xl">
      <CardHeader className="py-4 border-b border-slate-800/50 bg-slate-900/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold tracking-tight text-white flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-blue mr-2 shadow-[0_0_8px_var(--color-neon-blue)]" />
            COGNITIVE ASSISTANT
          </CardTitle>
          {props.fileId && (
            <Badge variant="outline" className="border-cyber-emerald/30 text-cyber-emerald bg-cyber-emerald/10 text-[10px] font-mono">
              CONTEXT: ON
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden relative bg-slate-950/20">
        <ScrollArea ref={scrollRef} className="h-full p-4">
          <div className="space-y-6">
            {messages.map((msg, i) => (msg.content && (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] p-4 rounded-2xl ${
                  msg.role === "user" 
                    ? "bg-neon-blue/80 text-white rounded-tr-none shadow-lg shadow-neon-blue/20" 
                    : "bg-slate-900/60 text-slate-100 border border-slate-800/50 rounded-tl-none"
                }`}>
                  <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950/50">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-900/40 text-slate-500 p-4 rounded-2xl rounded-tl-none border border-slate-800/50 italic text-xs animate-pulse font-mono tracking-tight">
                  NEURAL_PROCESSING_...
                </div>
              </div>
            )}
            <div className="h-4" />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 bg-slate-900/20 border-t border-slate-800/50">
        <div className="flex w-full space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask anything..."
            className="flex-1 bg-slate-950/40 border-slate-800/80 focus-visible:ring-neon-blue text-xs h-10"
          />
          <Button
            onClick={sendMessage}
            disabled={loading}
            className="bg-neon-blue hover:bg-neon-blue/80 text-white shadow-lg shadow-neon-blue/10 h-10 px-6 font-bold text-xs"
          >
            {loading ? <Loader2 className="animate-spin" /> : "SEND"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
