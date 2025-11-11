"use client";

import { Button } from "./button";
import { Square, CheckCircle2, Slash } from "lucide-react";

interface StreamControlsProps {
  streaming: boolean;
  onStop?: () => void; // legacy stop keep
  onStopKeep?: () => void; // stop and keep partial
  onStopClear?: () => void; // stop and clear partial
  completed?: boolean;
  variant?: 'inline' | 'default';
  tokensApprox?: number;
  wordsApprox?: number;
}
export default function StreamControls({ streaming, onStop, onStopKeep, onStopClear, completed, variant = 'default', tokensApprox, wordsApprox }: StreamControlsProps) {
  if (completed) {
    if (variant === 'inline') {
      return (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          <span>Done</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3 text-green-600" />
        <span>Completed</span>
      </div>
    );
  }
  if (!streaming) return null;
    const handleKeep = onStopKeep || onStop;
  const handleClear = onStopClear;
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-[11px]">
        {(tokensApprox || wordsApprox) && (
          <span className="text-muted-foreground">
            {tokensApprox ? `${tokensApprox} tok` : `${wordsApprox} w`}
          </span>
        )}
        <Button variant="ghost" size="sm" className="h-11 px-2" onClick={handleKeep} aria-label="Stop streaming">
          <Square className="h-4 w-4" /> Stop
        </Button>
        {handleClear && (
          <Button variant="ghost" size="sm" className="h-11 px-2" onClick={handleClear} aria-label="Stop and clear">
            <Slash className="h-4 w-4" /> Stop & Clear
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {(tokensApprox || wordsApprox) && (
        <span className="text-xs text-muted-foreground">
          {tokensApprox ? `${tokensApprox} tokens` : `${wordsApprox} words`}
        </span>
      )}
      <Button variant="ghost" size="sm" className="h-11 px-2" onClick={handleKeep} aria-label="Stop streaming">
        <Square className="h-4 w-4" /> Stop
      </Button>
      {handleClear && (
        <Button variant="ghost" size="sm" className="h-11 px-2" onClick={handleClear} aria-label="Stop and clear">
          <Slash className="h-4 w-4" /> Stop & Clear
        </Button>
      )}
    </div>
  );
}
