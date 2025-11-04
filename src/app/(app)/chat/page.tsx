"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth-listener';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Brain, Settings, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GeneralChat from '@/components/chat/GeneralChat';
import StudyBuddy from '@/components/chat/StudyBuddy';

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeChat, setActiveChat] = useState<'general' | 'study' | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for demo purposes
    setTimeout(() => {
      setIsLoading(false);
      if (user) {
        setUserId(user.id);
        // Default to general chat for new users
        setActiveChat('general');
      } else {
        router.push('/auth');
      }
    }, 1000);
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to continue</p>
          <Button onClick={() => router.push('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!activeChat) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">AI Study Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Choose your chat experience below
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* General Chat Card */}
          <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveChat('general')}>
            <div className="flex items-start justify-between mb-4">
              <MessageCircle className="h-8 w-8 text-blue-500" />
              <Badge variant="secondary">Free</Badge>
            </div>
            <h3 className="text-xl font-semibold mb-2">Ask Anything</h3>
            <p className="text-muted-foreground mb-4">
              General study questions and explanations. Get help with concepts, 
              problems, and study tips without personal context.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Instant responses</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>6 AI providers</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Web search enabled</span>
              </div>
            </div>
            <Button className="w-full mt-4" onClick={() => setActiveChat('general')}>
              Start General Chat
            </Button>
          </Card>

          {/* Study Buddy Card */}
          <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveChat('study')}>
            <div className="flex items-start justify-between mb-4">
              <Brain className="h-8 w-8 text-purple-500" />
              <Badge variant="secondary">Premium</Badge>
            </div>
            <h3 className="text-xl font-semibold mb-2">Study Buddy</h3>
            <p className="text-muted-foreground mb-4">
              Personalized study assistant with your academic data. Get insights 
              about your progress, weak areas, and tailored study advice.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Personal context</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Memory system</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Study analytics</span>
              </div>
            </div>
            <Button className="w-full mt-4" onClick={() => setActiveChat('study')}>
              Start Study Buddy
            </Button>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" onClick={() => router.push('/admin')}>
              <Settings className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <Activity className="h-4 w-4 mr-2" />
              System Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Mobile Header */}
      <div className="md:hidden border-b p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setActiveChat(null)}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          {activeChat === 'general' ? (
            <MessageCircle className="h-5 w-5" />
          ) : (
            <Brain className="h-5 w-5" />
          )}
          <span className="font-semibold">
            {activeChat === 'general' ? 'Ask Anything' : 'Study Buddy'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            AI Ready
          </Badge>
        </div>
      </div>

      {/* Chat Component */}
      <div className="flex-1">
        {activeChat === 'general' ? (
          <GeneralChat userId={userId} />
        ) : (
          <StudyBuddy userId={userId} />
        )}
      </div>
    </div>
  );
}