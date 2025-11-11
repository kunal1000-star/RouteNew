// UniversalChat - Base Component
// ================================
// Integrates with study buddy hook and provides core chat functionality

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudyBuddy } from '@/hooks/use-study-buddy';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';
import { ProviderSelector } from './ProviderSelector';
import { StudyContextPanel } from './StudyContextPanel';
import { TeachingModeToggle } from './TeachingModeToggle';
import { TeachingModeIndicator } from './TeachingModeIndicator';
import { TeachingModePanel } from './TeachingModePanel';
import { 
  Settings, 
  MessageSquare, 
  History, 
  PlusCircle, 
  Trash2, 
  Download,
  BookOpen,
  Brain,
  MemoryStick,
  Loader2
} from 'lucide-react';
import type { ChatMessage, ChatPreferences, StudyContext } from '@/types/study-buddy';

interface UniversalChatProps {
  className?: string;
  initialStudyContext?: Partial<StudyContext>;
  showSettings?: boolean;
  showStudyContext?: boolean;
  showProviderSelector?: boolean;
  showMemoryIndicators?: boolean;
  showTeachingMode?: boolean;
  compact?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export function UniversalChat({
  className = '',
  initialStudyContext,
  showSettings = true,
  showStudyContext = true,
  showProviderSelector = true,
  showMemoryIndicators = true,
  showTeachingMode = true,
  compact = false,
  theme = 'auto'
}: UniversalChatProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Core study buddy state and actions
  const {
    messages,
    isLoading,
    sessionId,
    userId,
    conversationId,
    preferences,
    studyContext,
    isSettingsOpen,
    isContextOpen,
    profileData,
    enhancedContext,
    layer2Context,
    teachingMode,
    handleSendMessage,
    startNewChat,
    clearChat,
    savePreferences,
    saveStudyContext,
    toggleSettings,
    toggleContext,
    exportChat,
    fetchProfileData,
    buildEnhancedStudyContext,
    getRelevantStudyMemories,
    optimizeStudyContext,
    getStudyKnowledgeBase,
    getContextOptimization,
    updateCompressionLevel,
    getTokenUsage,
    storeStudyInteraction,
    getLearningProgress,
    toggleTeachingMode,
    setTeachingMode,
    setTeachingModeType,
    updateTeachingPreferences
  } = useStudyBuddy();

  // Local state
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update input state based on loading
  useEffect(() => {
    setIsTyping(isLoading);
  }, [isLoading]);

  // Initialize with provided study context
  useEffect(() => {
    if (initialStudyContext && Object.keys(initialStudyContext).length > 0) {
      const mergedContext = { ...studyContext, ...initialStudyContext };
      saveStudyContext(mergedContext);
    }
  }, [initialStudyContext]);

  // Handle message sending
  const handleSubmit = async (message: string, attachments?: File[]) => {
    if (!message.trim() && (!attachments || attachments.length === 0)) return;

    setInputValue('');
    
    try {
      await handleSendMessage(message, attachments);
      
      // Store the interaction for learning
      if (message.trim().length > 10) {
        try {
          await storeStudyInteraction(message, 'response_content', {
            complexity: message.length > 100 ? 'complex' : 'moderate',
            sentiment: 'neutral',
            qualityScore: 0.8
          });
        } catch (error) {
          console.warn('Failed to store study interaction:', error);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle new chat
  const handleNewChat = () => {
    startNewChat();
    setInputValue('');
    toast({
      title: 'New Chat',
      description: 'Started a new study session.'
    });
  };

  // Handle clear chat
  const handleClearChat = () => {
    clearChat();
    setInputValue('');
    toast({
      title: 'Chat Cleared',
      description: 'All messages have been cleared.'
    });
  };

  // Handle export chat
  const handleExportChat = () => {
    exportChat();
    toast({
      title: 'Chat Exported',
      description: 'Your chat session has been exported.'
    });
  };

  // Build enhanced context
  const handleBuildContext = async () => {
    try {
      await buildEnhancedStudyContext();
      toast({
        title: 'Context Built',
        description: 'Enhanced study context has been generated.'
      });
    } catch (error) {
      toast({
        title: 'Context Error',
        description: 'Failed to build enhanced context.',
        variant: 'destructive'
      });
    }
  };

  // Get memory usage statistics
  const getMemoryStats = () => {
    return {
      totalMemories: layer2Context.relevantMemories.length,
      knowledgeResults: layer2Context.knowledgeBase.length,
      tokenUsage: layer2Context.tokenUsage,
      compressionLevel: layer2Context.compressionLevel
    };
  };

  const memoryStats = getMemoryStats();

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <CardHeader className={compact ? 'pb-3' : 'pb-4'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className={compact ? 'text-lg' : 'text-xl'}>
              Study Buddy Chat
            </CardTitle>
            {conversationId && (
              <Badge variant="outline" className="text-xs">
                {conversationId.slice(0, 8)}...
              </Badge>
            )}
          </div>
          
          {/* Memory indicators */}
          {showMemoryIndicators && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <MemoryStick className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">
                  {memoryStats.totalMemories}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">
                  {memoryStats.knowledgeResults}
                </span>
              </div>
              {memoryStats.tokenUsage > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {memoryStats.tokenUsage}t
                </Badge>
              )}
            </div>
          )}
  
          {/* Teaching Mode Indicator */}
          {showTeachingMode && teachingMode.isEnabled && (
            <TeachingModeIndicator
              isEnabled={teachingMode.isEnabled}
              mode={teachingMode.mode}
              activationCount={teachingMode.activationCount}
              className="ml-auto"
            />
          )}
        </div>

        {/* Context and Settings Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {showStudyContext && (
              <Button
                variant={isContextOpen ? "default" : "outline"}
                size="sm"
                onClick={toggleContext}
                className="h-11"
              >
                <BookOpen className="h-5 w-5 mr-1" />
                Study Context
              </Button>
            )}
            
            {showTeachingMode && (
              <TeachingModeToggle
                isEnabled={teachingMode.isEnabled}
                mode={teachingMode.mode}
                onToggle={toggleTeachingMode}
                onModeChange={setTeachingModeType}
                className="h-11"
              />
            )}
            
            {showProviderSelector && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSettings}
                className="h-11"
              >
                <Settings className="h-5 w-5 mr-1" />
                Settings
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              disabled={isLoading}
              className="h-11 w-11"
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              disabled={isLoading}
              className="h-11 w-11"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportChat}
              disabled={messages.length === 0}
              className="h-11 w-11"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Study Context Panel */}
      {showStudyContext && isContextOpen && (
        <div className="px-4 pb-4">
          <StudyContextPanel
            studyContext={studyContext}
            profileData={profileData}
            onUpdateContext={saveStudyContext}
            enhancedContext={enhancedContext}
            layer2Context={layer2Context}
            onBuildContext={handleBuildContext}
            onGetMemories={getRelevantStudyMemories}
            onOptimizeContext={optimizeStudyContext}
            onSearchKnowledge={getStudyKnowledgeBase}
            onUpdateCompressionLevel={updateCompressionLevel}
          />
        </div>
      )}

      {/* Teaching Mode Panel */}
      {showTeachingMode && teachingMode.isEnabled && (
        <div className="px-4 pb-4">
          <TeachingModePanel
            isEnabled={teachingMode.isEnabled}
            mode={teachingMode.mode}
            preferences={teachingMode.preferences}
            onPreferencesChange={updateTeachingPreferences}
            onModeChange={setTeachingModeType}
            onToggle={toggleTeachingMode}
          />
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && isSettingsOpen && (
        <div className="px-4 pb-4">
          <div className="space-y-4">
            <ProviderSelector
              preferences={preferences}
              onUpdatePreferences={savePreferences}
            />
            {enhancedContext && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">Context Optimization</h4>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>Level: {layer2Context.compressionLevel}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Tokens: {getTokenUsage()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Welcome to Study Buddy!</h3>
                <p className="text-muted-foreground mb-4">
                  Start a conversation to get personalized study help.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>💡 Try asking: "Explain thermodynamics"</p>
                  <p>📚 Or: "Help me with organic chemistry"</p>
                  <p>🧠 Or: "Do you remember my name?"</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isTyping={isTyping && message.id === lastMessageId}
                  showMemoryReferences={showMemoryIndicators}
                />
              ))
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Study Buddy is thinking...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input Area */}
      <div className="p-4 border-t">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder="Ask me anything about your studies..."
          showAttachments={true}
          onAttachmentClick={() => fileInputRef.current?.click()}
        />
        
        {/* Hidden file input for attachments */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0 && inputValue.trim()) {
              handleSubmit(inputValue, files);
            }
          }}
        />
      </div>
    </Card>
  );
}

export default UniversalChat;