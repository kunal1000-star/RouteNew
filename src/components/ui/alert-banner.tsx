"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function AlertBanner({ message, onRetry, onDismiss, className }: AlertBannerProps) {
  return (
    <div role="alert" className={cn("w-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded flex items-center justify-between gap-2", className)}>
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4" />
        <span>{message}</span>
      </div>
      <div className="flex items-center gap-2">
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="h-11 px-2">Retry</Button>
        )}
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss} className="h-11 px-2">Dismiss</Button>
        )}
      </div>
    </div>
  );
}
