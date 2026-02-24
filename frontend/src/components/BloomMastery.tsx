import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BloomLevel {
  name: string;
  label: string;
  color: string;
  progress: number;
}

const BLOOM_LEVELS: BloomLevel[] = [
  { name: "Remember", label: "Запам'ятовування", color: "bg-slate-700", progress: 80 },
  { name: "Understand", label: "Розуміння", color: "bg-blue-500", progress: 60 },
  { name: "Apply", label: "Застосування", color: "bg-cyber-emerald", progress: 30 },
  { name: "Analyze", label: "Аналіз", color: "bg-electric-violet", progress: 10 },
  { name: "Evaluate", label: "Оцінка", color: "bg-neon-blue", progress: 0 },
  { name: "Create", label: "Створення", color: "bg-white", progress: 0 },
];

export function BloomMastery() {
  return (
    <div className="flex flex-col space-y-3 w-full max-w-2xl">
      <div className="flex justify-between items-end mb-1">
        <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">
          Cognitive Mastery <span className="text-slate-700">/ Bloom's Taxonomy</span>
        </h4>
        <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-slate-800 text-slate-400 font-mono">
          LVL 2: UNDERSTAND
        </Badge>
      </div>
      
      <div className="grid grid-cols-6 gap-1.5 h-1.5">
        {BLOOM_LEVELS.map((level) => (
          <div key={level.name} className="relative group">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-slate-900 border border-slate-800 text-[8px] px-2 py-1 rounded whitespace-nowrap text-slate-300">
                {level.name}: {level.progress}%
              </div>
            </div>
            <Progress 
              value={level.progress} 
              className={cn("h-full bg-slate-900 overflow-hidden rounded-full")}
              // @ts-ignore - shadcn progress bar custom styling through global css or inline
              style={{ "--progress-foreground": `var(--color-${level.name.toLowerCase()})` }}
            />
            {/* Fallback internal div for custom colored segments */}
            <div className="absolute inset-0 bg-slate-900 rounded-full overflow-hidden">
               <div 
                  className={cn("h-full transition-all duration-1000", level.color)}
                  style={{ width: `${level.progress}%` }}
               />
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between text-[9px] font-medium text-slate-600 font-mono uppercase tracking-tight">
        <span>Recall</span>
        <span>Insight</span>
        <span>Practice</span>
        <span>Logic</span>
        <span>Critique</span>
        <span>Synthesis</span>
      </div>
    </div>
  );
}
