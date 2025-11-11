'use client';

import React, { useEffect, useState } from 'react';
import { ChatInput } from './ChatInput';
import { MobileChatInput } from './MobileChatInput';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ResponsiveChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string, attachments?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  showAttachments?: boolean;
  onAttachmentClick?: () => void;
  preferences?: any;
  onUpdatePreferences?: (preferences: Partial<any>) => void;
  maxLength?: number;
}

export function ResponsiveChatInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = "Ask me anything about your studies...",
  showAttachments = true,
  onAttachmentClick,
  preferences,
  onUpdatePreferences,
  maxLength = 4000,
}: ResponsiveChatInputProps) {
  // Use mobile breakpoint at 768px (md breakpoint)
  const isMobile = useMediaQuery('(max-width: 768px)');

  return isMobile ? (
    <MobileChatInput
      value={value}
      onChange={onChange}
      onSubmit={onSubmit}
      isLoading={isLoading}
      placeholder={placeholder}
      showAttachments={showAttachments}
      onAttachmentClick={onAttachmentClick}
      preferences={preferences}
      onUpdatePreferences={onUpdatePreferences}
      maxLength={maxLength}
    />
  ) : (
    <ChatInput
      onSendMessage={onSubmit}
      onFileUpload={onAttachmentClick}
      disabled={isLoading}
      preferences={preferences || {}}
      onUpdatePreferences={onUpdatePreferences || (() => {})}
      placeholder={placeholder}
      maxLength={maxLength}
    />
  );
}