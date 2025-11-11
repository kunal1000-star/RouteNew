// Save Button Component
// =====================
// Small save button for individual messages with hover state and save functionality

'use client';

import React, { useState } from 'react';
import { Save, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/study-buddy';

interface SaveButtonProps {
  message: ChatMessage;
  conversationId?: string;
  isLoading?: boolean;
  onSaveClick?: (message: ChatMessage, conversationId?: string) => void;
  className?: string;
  variant?: 'default' | 'compact';
  showTooltip?: boolean;
}

export function SaveButton({
  message,
  conversationId,
  isLoading = false,
  onSaveClick,
  className = '',
  variant = 'default',
  showTooltip = true
}: SaveButtonProps) {
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isSaving || isSaved) return;

    setSaving(true);
    
    try {
      if (onSaveClick) {
        await onSaveClick(message, conversationId);
      }
      setIsSaved(true);
      toast({
        title: 'Message saved',
        description: 'Content has been saved to Google Drive.',
      });
      
      // Reset saved state after 3 seconds
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save content to Google Drive.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const buttonContent = () => {
    if (isSaved) {
      return <Check className="w-3 h-3 text-green-500" />;
    } else if (isLoading || isSaving) {
      return <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />;
    } else {
      return <Save className="w-3 h-3" />;
    }
  };

  const buttonElement = (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'transition-all duration-200',
        variant === 'compact' ? 'h-6 w-6 p-0' : 'h-7 w-7 p-0',
        isSaved && 'text-green-500',
        isSaving && 'text-blue-500',
        className
      )}
      onClick={handleSave}
      disabled={isLoading || isSaving}
      title={isSaved ? 'Saved to Google Drive' : 'Save to Google Drive'}
    >
      {buttonContent()}
    </Button>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonElement}
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">
                {isSaved ? 'Saved to Google Drive' : 'Save to Google Drive'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isSaved 
                  ? 'Content saved successfully' 
                  : 'Save this message with AI enhancement'
                }
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonElement;
}

export default SaveButton;