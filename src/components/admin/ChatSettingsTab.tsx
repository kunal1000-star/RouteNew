'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  RefreshCw,
  MessageSquare,
  Clock,
  Zap,
  Brain,
  Settings,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Shield,
  Timer,
  FileText,
  Hash,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { safeApiCall } from '@/lib/utils/safe-api';

interface ChatSettings {
  // General Chat Settings
  maxConversationLength: number;
  maxMessagesPerConversation: number;
  enableConversationHistory: boolean;
  enableContextRetention: boolean;
  contextRetentionDays: number;
  
  // Response Settings
  defaultResponseStyle: 'concise' | 'detailed' | 'balanced';
  enableStreaming: boolean;
  responseTimeout: number;
  maxRetries: number;
  
  // Context Management
  maxContextTokens: number;
  contextWindowStrategy: 'sliding' | 'summarize' | 'truncate';
  enableContextCompression: boolean;
  contextCompressionRatio: number;
  
  // Message Handling
  enableMessageFiltering: boolean;
  enableAutoModeration: boolean;
  maxMessageLength: number;
  enableMessageEncryption: boolean;
  
  // Rate Limiting
  enableRateLimiting: boolean;
  messagesPerMinute: number;
  messagesPerHour: number;
  messagesPerDay: number;
  
  // Advanced Settings
  enableMemoryPersistence: boolean;
  memoryPersistenceType: 'session' | 'user' | 'global';
  enableConversationAnalytics: boolean;
  enableExportFunctionality: boolean;
  
  // Custom Prompts
  systemPrompt: string;
  welcomeMessage: string;
  fallbackMessage: string;
  errorMessage: string;
  
  // Integration Settings
  enableWebSearch: boolean;
  enableFileUpload: boolean;
  maxFileSize: number;
  enableImageProcessing: boolean;
}

const DEFAULT_SETTINGS: ChatSettings = {
  maxConversationLength: 50,
  maxMessagesPerConversation: 100,
  enableConversationHistory: true,
  enableContextRetention: true,
  contextRetentionDays: 30,
  defaultResponseStyle: 'balanced',
  enableStreaming: true,
  responseTimeout: 30000,
  maxRetries: 3,
  maxContextTokens: 8192,
  contextWindowStrategy: 'sliding',
  enableContextCompression: false,
  contextCompressionRatio: 0.8,
  enableMessageFiltering: true,
  enableAutoModeration: true,
  maxMessageLength: 4000,
  enableMessageEncryption: false,
  enableRateLimiting: true,
  messagesPerMinute: 10,
  messagesPerHour: 100,
  messagesPerDay: 500,
  enableMemoryPersistence: true,
  memoryPersistenceType: 'user',
  enableConversationAnalytics: true,
  enableExportFunctionality: true,
  systemPrompt: 'You are a helpful AI assistant focused on providing accurate and helpful responses.',
  welcomeMessage: 'Hello! How can I help you today?',
  fallbackMessage: 'I apologize, but I\'m having trouble processing your request. Please try rephrasing your question.',
  errorMessage: 'An error occurred while processing your request. Please try again.',
  enableWebSearch: false,
  enableFileUpload: true,
  maxFileSize: 10485760, // 10MB
  enableImageProcessing: true
};

export function ChatSettingsTab() {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log('🔍 ChatSettingsTab: Starting to load settings...');
      
      const result = await safeApiCall('/api/admin/chat-settings');
      console.log('📡 ChatSettingsTab: API response received:', result);
      
      if (result.success) {
        const data = result.data;
        console.log('📋 ChatSettingsTab: Data structure:', typeof data, data);
        
        if (data && data.success) {
          console.log('✅ ChatSettingsTab: Settings loaded successfully:', data.data);
          setSettings(data.data);
          setOriginalSettings(data.data);
        } else {
          console.warn('⚠️ ChatSettingsTab: Data.success is false or missing');
          throw new Error('Settings response invalid: ' + JSON.stringify(data));
        }
      } else {
        console.error('❌ ChatSettingsTab: API call failed:', result.error);
        throw new Error(result.error || 'Failed to load settings');
      }
    } catch (error) {
      console.error('🚨 ChatSettingsTab: Critical error in loadSettings:', error);
      console.error('🚨 Error details:', error.message, error.stack);
      console.log('🔄 ChatSettingsTab: Falling back to default settings');
      setSettings(DEFAULT_SETTINGS);
      setOriginalSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
      console.log('⏱️ ChatSettingsTab: Loading complete');
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      console.log('💾 ChatSettingsTab: Attempting to save settings:', settings);
      
      const result = await safeApiCall('/api/admin/chat-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      console.log('📡 ChatSettingsTab: Save API response:', result);
      
      if (result.success && result.data) {
        console.log('✅ ChatSettingsTab: Settings saved successfully');
        setHasUnsavedChanges(false);
        setOriginalSettings(settings);
        alert('Chat settings saved successfully!');
      } else if (result.success) {
        // Handle case where API returns success but no data
        console.warn('⚠️ ChatSettingsTab: Save successful but no data returned');
        setHasUnsavedChanges(false);
        setOriginalSettings(settings);
        alert('Chat settings saved successfully!');
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('🚨 ChatSettingsTab: Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasUnsavedChanges(true);
  };

  const updateSetting = (key: keyof ChatSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chat Settings</h2>
          <p className="text-muted-foreground">
            Configure chat behavior, conversation parameters, and message handling options.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Alert className="mr-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes
              </AlertDescription>
            </Alert>
          )}
          <Button onClick={resetToDefaults} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={saveSettings} disabled={saving || !hasChanges}>
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="context">Context</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <GeneralSettings settings={settings} onUpdate={updateSetting} />
        </TabsContent>

        <TabsContent value="responses" className="space-y-6 mt-6">
          <ResponseSettings settings={settings} onUpdate={updateSetting} />
        </TabsContent>

        <TabsContent value="context" className="space-y-6 mt-6">
          <ContextSettings settings={settings} onUpdate={updateSetting} />
        </TabsContent>

        <TabsContent value="messages" className="space-y-6 mt-6">
          <MessageSettings settings={settings} onUpdate={updateSetting} />
        </TabsContent>

        <TabsContent value="limits" className="space-y-6 mt-6">
          <LimitSettings settings={settings} onUpdate={updateSetting} />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6 mt-6">
          <AdvancedSettings settings={settings} onUpdate={updateSetting} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Individual Settings Components
function GeneralSettings({ settings, onUpdate }: { settings: ChatSettings; onUpdate: (key: keyof ChatSettings, value: any) => void }) {
  // Safety check to prevent undefined errors
  if (!settings) {
    console.warn('🚨 GeneralSettings: settings is undefined, using defaults');
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation Settings (Loading...)
          </h3>
          <p className="text-muted-foreground">Settings are still loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversation Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Max Conversation Length (messages)</Label>
            <Input
              type="number"
              value={settings.maxConversationLength || 50}
              onChange={(e) => onUpdate('maxConversationLength', parseInt(e.target.value))}
              min="10"
              max="1000"
            />
          </div>
          <div>
            <Label>Max Messages Per Conversation</Label>
            <Input
              type="number"
              value={settings.maxMessagesPerConversation}
              onChange={(e) => onUpdate('maxMessagesPerConversation', parseInt(e.target.value))}
              min="50"
              max="10000"
            />
          </div>
          <div>
            <Label>Context Retention Days</Label>
            <Input
              type="number"
              value={settings.contextRetentionDays}
              onChange={(e) => onUpdate('contextRetentionDays', parseInt(e.target.value))}
              min="1"
              max="365"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <Switch
            checked={settings.enableConversationHistory}
            onCheckedChange={(checked) => onUpdate('enableConversationHistory', checked)}
          />
          <Label>Enable Conversation History</Label>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <Switch
            checked={settings.enableContextRetention}
            onCheckedChange={(checked) => onUpdate('enableContextRetention', checked)}
          />
          <Label>Enable Context Retention</Label>
        </div>
      </Card>
    </div>
  );
}

function ResponseSettings({ settings, onUpdate }: { settings: ChatSettings; onUpdate: (key: keyof ChatSettings, value: any) => void }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Response Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Default Response Style</Label>
            <Select
              value={settings.defaultResponseStyle}
              onValueChange={(value) => onUpdate('defaultResponseStyle', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Response Timeout (ms)</Label>
            <Input
              type="number"
              value={settings.responseTimeout}
              onChange={(e) => onUpdate('responseTimeout', parseInt(e.target.value))}
              min="5000"
              max="120000"
            />
          </div>
          <div>
            <Label>Max Retries</Label>
            <Input
              type="number"
              value={settings.maxRetries}
              onChange={(e) => onUpdate('maxRetries', parseInt(e.target.value))}
              min="1"
              max="10"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <Switch
            checked={settings.enableStreaming}
            onCheckedChange={(checked) => onUpdate('enableStreaming', checked)}
          />
          <Label>Enable Streaming Responses</Label>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Custom Messages
        </h3>
        <div className="space-y-4">
          <div>
            <Label>System Prompt</Label>
            <Textarea
              value={settings.systemPrompt}
              onChange={(e) => onUpdate('systemPrompt', e.target.value)}
              rows={3}
              placeholder="Enter system prompt for AI assistant..."
            />
          </div>
          <div>
            <Label>Welcome Message</Label>
            <Textarea
              value={settings.welcomeMessage}
              onChange={(e) => onUpdate('welcomeMessage', e.target.value)}
              rows={2}
              placeholder="Welcome message for new conversations..."
            />
          </div>
          <div>
            <Label>Fallback Message</Label>
            <Textarea
              value={settings.fallbackMessage}
              onChange={(e) => onUpdate('fallbackMessage', e.target.value)}
              rows={2}
              placeholder="Message when request cannot be processed..."
            />
          </div>
          <div>
            <Label>Error Message</Label>
            <Textarea
              value={settings.errorMessage}
              onChange={(e) => onUpdate('errorMessage', e.target.value)}
              rows={2}
              placeholder="Message when an error occurs..."
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function ContextSettings({ settings, onUpdate }: { settings: ChatSettings; onUpdate: (key: keyof ChatSettings, value: any) => void }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Context Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Max Context Tokens</Label>
            <Input
              type="number"
              value={settings.maxContextTokens}
              onChange={(e) => onUpdate('maxContextTokens', parseInt(e.target.value))}
              min="1024"
              max="32768"
            />
          </div>
          <div>
            <Label>Context Window Strategy</Label>
            <Select
              value={settings.contextWindowStrategy}
              onValueChange={(value) => onUpdate('contextWindowStrategy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sliding">Sliding Window</SelectItem>
                <SelectItem value="summarize">Summarize</SelectItem>
                <SelectItem value="truncate">Truncate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Context Compression Ratio</Label>
            <div className="space-y-2">
              <Slider
                value={[settings.contextCompressionRatio]}
                onValueChange={([value]) => onUpdate('contextCompressionRatio', value)}
                max={1}
                min={0.1}
                step={0.1}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground">
                {Math.round(settings.contextCompressionRatio * 100)}% of original size
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <Switch
            checked={settings.enableContextCompression}
            onCheckedChange={(checked) => onUpdate('enableContextCompression', checked)}
          />
          <Label>Enable Context Compression</Label>
        </div>
      </Card>
    </div>
  );
}

function MessageSettings({ settings, onUpdate }: { settings: ChatSettings; onUpdate: (key: keyof ChatSettings, value: any) => void }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Hash className="h-5 w-5" />
          Message Handling
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Max Message Length (characters)</Label>
            <Input
              type="number"
              value={settings.maxMessageLength}
              onChange={(e) => onUpdate('maxMessageLength', parseInt(e.target.value))}
              min="100"
              max="10000"
            />
          </div>
          <div>
            <Label>Max File Size (bytes)</Label>
            <Input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => onUpdate('maxFileSize', parseInt(e.target.value))}
              min="1048576"
              max="104857600"
            />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.enableMessageFiltering}
              onCheckedChange={(checked) => onUpdate('enableMessageFiltering', checked)}
            />
            <Label>Enable Message Filtering</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.enableAutoModeration}
              onCheckedChange={(checked) => onUpdate('enableAutoModeration', checked)}
            />
            <Label>Enable Auto Moderation</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.enableMessageEncryption}
              onCheckedChange={(checked) => onUpdate('enableMessageEncryption', checked)}
            />
            <Label>Enable Message Encryption</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.enableFileUpload}
              onCheckedChange={(checked) => onUpdate('enableFileUpload', checked)}
            />
            <Label>Enable File Upload</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.enableImageProcessing}
              onCheckedChange={(checked) => onUpdate('enableImageProcessing', checked)}
            />
            <Label>Enable Image Processing</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.enableWebSearch}
              onCheckedChange={(checked) => onUpdate('enableWebSearch', checked)}
            />
            <Label>Enable Web Search</Label>
          </div>
        </div>
      </Card>
    </div>
  );
}

function LimitSettings({ settings, onUpdate }: { settings: ChatSettings; onUpdate: (key: keyof ChatSettings, value: any) => void }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Rate Limiting
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label>Messages Per Minute</Label>
            <Input
              type="number"
              value={settings.messagesPerMinute}
              onChange={(e) => onUpdate('messagesPerMinute', parseInt(e.target.value))}
              min="1"
              max="100"
            />
          </div>
          <div>
            <Label>Messages Per Hour</Label>
            <Input
              type="number"
              value={settings.messagesPerHour}
              onChange={(e) => onUpdate('messagesPerHour', parseInt(e.target.value))}
              min="10"
              max="1000"
            />
          </div>
          <div>
            <Label>Messages Per Day</Label>
            <Input
              type="number"
              value={settings.messagesPerDay}
              onChange={(e) => onUpdate('messagesPerDay', parseInt(e.target.value))}
              min="100"
              max="10000"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <Switch
            checked={settings.enableRateLimiting}
            onCheckedChange={(checked) => onUpdate('enableRateLimiting', checked)}
          />
          <Label>Enable Rate Limiting</Label>
        </div>
      </Card>
    </div>
  );
}

function AdvancedSettings({ settings, onUpdate }: { settings: ChatSettings; onUpdate: (key: keyof ChatSettings, value: any) => void }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Advanced Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Memory Persistence Type</Label>
            <Select
              value={settings.memoryPersistenceType}
              onValueChange={(value) => onUpdate('memoryPersistenceType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="session">Session</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.enableMemoryPersistence}
              onCheckedChange={(checked) => onUpdate('enableMemoryPersistence', checked)}
            />
            <Label>Enable Memory Persistence</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.enableConversationAnalytics}
              onCheckedChange={(checked) => onUpdate('enableConversationAnalytics', checked)}
            />
            <Label>Enable Conversation Analytics</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.enableExportFunctionality}
              onCheckedChange={(checked) => onUpdate('enableExportFunctionality', checked)}
            />
            <Label>Enable Export Functionality</Label>
          </div>
        </div>
      </Card>
    </div>
  );
}
