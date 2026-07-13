import { PipelineStep } from "@/types/research";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";


interface ResearchProgressProps {
  pipeline: PipelineStep[];
}

export function ResearchProgress({ pipeline }: ResearchProgressProps) {
  if (!pipeline || pipeline.length === 0) return null;

  return (
    <div className="glass p-4 rounded-2xl mb-8 overflow-x-auto hide-scrollbar">
      <div className="flex items-center min-w-max gap-4 md:gap-8 px-2">
        {pipeline.map((step, idx) => {
          const isComplete = step.status === "complete";
          const isProcessing = step.status === "processing";
          const isError = step.status === "error";
          const isPending = step.status === "pending";

          return (
            <div key={step.id} className="flex items-center gap-3 group">
              {/* Status Icon */}
              <div className="relative flex-shrink-0">
                {isComplete && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                {isProcessing && <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />}
                {isError && <XCircle className="h-5 w-5 text-destructive" />}
                {isPending && <Circle className="h-5 w-5 text-muted-foreground/40" />}
                
                {isProcessing && (
                  <span className="absolute -inset-1 rounded-full bg-indigo-500/20 animate-pulse" />
                )}
              </div>

              {/* Text */}
              <div className="flex flex-col">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  isComplete ? "text-foreground" :
                  isProcessing ? "text-indigo-400" :
                  "text-muted-foreground"
                }`}>
                  {step.title}
                </span>
                <span className="text-[10px] text-muted-foreground max-w-[120px] truncate hidden md:block">
                  {step.description}
                </span>
              </div>

              {/* Connecting Line (except last) */}
              {idx < pipeline.length - 1 && (
                <div className={`h-[1px] w-8 md:w-16 ml-4 ${
                  isComplete ? "bg-emerald-500/50" : "bg-border"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
