"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, Plus, MessageCircle, Search, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model_used?: string;
  provider_used?: string;
  tokens_used?: number;
  latency_ms?: number;
  cached?: boolean;
  web_search_enabled?: boolean;
}

interface ChatConversation {
  id: string;
  title: string;
  chat_type: 'general' | 'study_assistant';
  created_at: string;
  updated_at: string;
}

interface GeneralChatProps {
  userId: string;
  className?: string;
}

export default function GeneralChat({ userId, className }: GeneralChatProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await fetch(`/api/chat/conversations?userId=${userId}&chatType=general`);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const startNewConversation = async () => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          chatType: 'general',
          title: 'New Chat'
        })
      });
      const data = await response.json();
      if (data.conversation) {
        setCurrentConversation(data.conversation);
        setMessages([]);
        setSidebarOpen(false);
        setConversations(prev => [data.conversation, ...prev]);
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const selectConversation = (conversation: ChatConversation) => {
    setCurrentConversation(conversation);
    loadMessages(conversation.id);
    setSidebarOpen(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat/general/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          conversationId: currentConversation?.id,
          message: messageText,
          chatType: 'general'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const aiResponse = data.response;

      // Remove temporary user message and add real ones
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== userMessage.id);
        return [
          ...filtered,
          {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date().toISOString()
          },
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: aiResponse.content,
            timestamp: new Date().toISOString(),
            model_used: aiResponse.model_used,
            provider_used: aiResponse.provider,
            tokens_used: aiResponse.tokens_used.input + aiResponse.tokens_used.output,
            latency_ms: aiResponse.latency_ms,
            cached: aiResponse.cached,
            web_search_enabled: aiResponse.web_search_enabled
          }
        ];
      });

      // Update conversation if it's new
      if (data.conversationId && !currentConversation) {
        const newConversation: ChatConversation = {
          id: data.conversationId,
          title: messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText,
          chat_type: 'general',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setCurrentConversation(newConversation);
        setConversations(prev => [newConversation, ...prev]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove the user message if sending failed
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I\'m having trouble responding right now. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={`flex h-full ${className}`}>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h1 className="font-semibold">Ask Anything</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-40 w-80 bg-background border-r transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Conversations</h2>
            <Button
              size="sm"
              onClick={startNewConversation}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoadingConversations ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new chat to begin</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={`
                    p-3 mb-2 cursor-pointer transition-colors hover:bg-accent
                    ${currentConversation?.id === conversation.id ? 'bg-accent border-primary' : ''}
                  `}
                  onClick={() => selectConversation(conversation)}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-sm truncate flex-1 mr-2">
                      {conversation.title}
                    </h3>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(conversation.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      General
                    </Badge>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(conversation.created_at)}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                {currentConversation ? currentConversation.title : 'Ask Anything'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Ask general study questions
              </p>
            </div>
            {currentConversation && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  General Chat
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Start a conversation</h3>
              <p className="text-muted-foreground mb-4">
                Ask me anything about your studies, and I'll help you out!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md">
                {[
                  "What is entropy in thermodynamics?",
                  "How do I solve quadratic equations?",
                  "Explain Newton's laws of motion",
                  "What is the difference between speed and velocity?"
                ].map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto py-2 px-3"
                    onClick={() => setInputMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`
                    flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}
                  `}
                >
                  <div
                    className={`
                      max-w-[80%] sm:max-w-[70%] rounded-lg p-3
                      ${message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-4'
                        : 'bg-muted mr-4'
                      }
                    `}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Message metadata for AI responses */}
                    {message.role === 'assistant' && (
                      <div className="mt-2 pt-2 border-t border-border/20">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {message.model_used && (
                            <span>Powered by {message.model_used}</span>
                          )}
                          {message.latency_ms && (
                            <span>• {message.latency_ms}ms</span>
                          )}
                          {message.tokens_used && (
                            <span>• {message.tokens_used} tokens</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {message.cached && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              From cache
                            </Badge>
                          )}
                          {message.web_search_enabled && (
                            <Badge variant="secondary" className="text-xs">
                              <Search className="h-3 w-3 mr-1" />
                              Live search
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs opacity-70 mt-1">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 mr-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span>Getting response...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question here..."
              disabled={isLoading}
              className="flex-1"
              maxLength={500}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>{inputMessage.length}/500</span>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}