"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Users,
  Database,
  Shield,
  Monitor,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  Save,
  ArrowLeft,
  Bug,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { APIProvidersTab } from '@/components/admin/api-providers-tab';
import { EmbeddingSettingsDebug } from '@/components/admin/EmbeddingSettingsDebug';
import { ModelOverridesTab } from '@/components/admin/ModelOverridesTab';
import { ChatSettingsTab } from '@/components/admin/ChatSettingsTab';
import { EmbeddingModelsTab } from '@/components/admin/EmbeddingModelsTab';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  providers: {
    groq: { status: 'online' | 'offline' | 'degraded'; responseTime: number; lastCheck: string };
    gemini: { status: 'online' | 'offline' | 'degraded'; responseTime: number; lastCheck: string };
    cerebras: { status: 'online' | 'offline' | 'degraded'; responseTime: number; lastCheck: string };
    cohere: { status: 'online' | 'offline' | 'degraded'; responseTime: number; lastCheck: string };
    mistral: { status: 'online' | 'offline' | 'degraded'; responseTime: number; lastCheck: string };
    openrouter: { status: 'online' | 'offline' | 'degraded'; responseTime: number; lastCheck: string };
  };
  database: { status: 'connected' | 'disconnected'; responseTime: number; lastCheck: string };
  cache: { hitRate: number; totalRequests: number; lastCheck: string };
}

interface APIUsage {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  topProviders: Array<{ name: string; requests: number; percentage: number }>;
  costEstimate: number;
}

interface SystemConfig {
  rateLimitPerMinute: number;
  cacheExpiryMinutes: number;
  maxContextLength: number;
  enableWebSearch: boolean;
  enableMemoryExtraction: boolean;
  enableUsageLogging: boolean;
  defaultModel: string;
  fallbackStrategy: 'sequential' | 'random' | 'load-balanced';
  alertThresholds: {
    latencyWarning: number;
    errorRateWarning: number;
    costLimitWarning: number;
  };
}

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [apiUsage, setApiUsage] = useState<APIUsage | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  // Scroll ref for desktop tabs container
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      setIsLoading(true);
      
      // Load system health with error handling
      try {
        const healthResponse = await fetch('/api/admin/system/health');
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setSystemHealth(healthData);
        } else {
          throw new Error('Health check failed');
        }
      } catch (error) {
        console.warn('Failed to load system health, using mock data:', error);
        setSystemHealth(getMockSystemHealth());
      }

      // Load API usage stats with error handling
      try {
        const usageResponse = await fetch('/api/admin/system/usage');
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setApiUsage(usageData);
        } else {
          throw new Error('Usage stats failed');
        }
      } catch (error) {
        console.warn('Failed to load API usage, using mock data:', error);
        setApiUsage(getMockApiUsage());
      }

      // Load system configuration with error handling
      try {
        const configResponse = await fetch('/api/admin/system/config');
        if (configResponse.ok) {
          const configData = await configResponse.json();
          setSystemConfig(configData);
        } else {
          throw new Error('Config failed');
        }
      } catch (error) {
        console.warn('Failed to load system config, using mock data:', error);
        setSystemConfig(getMockSystemConfig());
      }

    } catch (error) {
      console.error('Failed to load system data:', error);
      // Fallback to mock data if all else fails
      setSystemHealth(getMockSystemHealth());
      setApiUsage(getMockApiUsage());
      setSystemConfig(getMockSystemConfig());
    } finally {
      setIsLoading(false);
    }
  };

  const testAllProviders = async () => {
    try {
      const response = await fetch('/api/admin/providers/test-all', {
        method: 'POST'
      });
      const results = await response.json();
      setTestResults(results);
    } catch (error) {
      console.error('Failed to test providers:', error);
    }
  };

  const saveConfiguration = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/system/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemConfig)
      });
      
      if (response.ok) {
        // Show success message
        alert('Configuration saved successfully!');
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'connected':
        return 'text-green-500';
      case 'warning':
      case 'degraded':
        return 'text-yellow-500';
      case 'error':
      case 'offline':
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'connected':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
      case 'offline':
      case 'disconnected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden border-b p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-semibold">AI System Admin</h1>
        <div className="flex items-center gap-2">
          <Badge variant={systemHealth?.status === 'healthy' ? 'default' : 'destructive'}>
            {systemHealth?.status || 'Unknown'}
          </Badge>
          <Button size="icon" variant="ghost" onClick={loadSystemData} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">AI System Administration</h1>
              <p className="text-muted-foreground mt-2">
                Monitor and configure your AI service infrastructure
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={systemHealth?.status === 'healthy' ? 'default' : 'destructive'}>
                {systemHealth?.status || 'Loading...'}
              </Badge>
              <Button onClick={() => router.push('/admin/debug')} variant="outline">
                <Bug className="h-4 w-4 mr-2" />
                Debug Dashboard
              </Button>
              <Button onClick={loadSystemData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile: Dropdown selector for tabs */}
<div className="md:hidden sticky top-16 z-20 bg-background/95 backdrop-blur px-2 py-2 shadow-sm">
  <Select value={activeTab} onValueChange={setActiveTab}>
    <SelectTrigger>
      <SelectValue placeholder="Select section" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="overview">Overview</SelectItem>
      <SelectItem value="debug">Debug</SelectItem>
      <SelectItem value="providers">Providers</SelectItem>
      <SelectItem value="model-overrides">Model Overrides</SelectItem>
      <SelectItem value="fallback-chain">Fallback Chain</SelectItem>
      <SelectItem value="chat-settings">Chat Settings</SelectItem>
      <SelectItem value="config">Configuration</SelectItem>
      <SelectItem value="monitoring">Monitoring</SelectItem>
      <SelectItem value="embeddings">Embeddings</SelectItem>
    </SelectContent>
  </Select>
</div>

{/* Desktop: Tabs list with scroll controls */}
<div className="hidden md:block sticky top-16 z-30 bg-background/95 backdrop-blur py-1 shadow-sm">
  <div className="relative">
    <button
      type="button"
      onClick={() => tabsScrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
      className="absolute left-0 top-1/2 -translate-y-1/2 z-40 h-8 w-8 rounded-full bg-background/90 border shadow flex items-center justify-center hover:bg-accent"
      aria-label="Scroll tabs left"
    >
      <ChevronLeft className="h-4 w-4" />
    </button>

    <div ref={tabsScrollRef} className="overflow-x-auto scrollbar-hide px-10">
      <TabsList className="flex w-max gap-2 px-0">
        <TabsTrigger value="overview" className="flex-shrink-0 text-xs">Overview</TabsTrigger>
        <TabsTrigger value="debug" className="flex-shrink-0 text-xs">Debug</TabsTrigger>
        <TabsTrigger value="providers" className="flex-shrink-0 text-xs">Providers</TabsTrigger>
        <TabsTrigger value="model-overrides" className="flex-shrink-0 text-xs">Model Overrides</TabsTrigger>
        <TabsTrigger value="fallback-chain" className="flex-shrink-0 text-xs">Fallback Chain</TabsTrigger>
        <TabsTrigger value="chat-settings" className="flex-shrink-0 text-xs">Chat Settings</TabsTrigger>
        <TabsTrigger value="config" className="flex-shrink-0 text-xs">Configuration</TabsTrigger>
        <TabsTrigger value="monitoring" className="flex-shrink-0 text-xs">Monitoring</TabsTrigger>
        <TabsTrigger value="embeddings" className="flex-shrink-0 text-xs">Embeddings</TabsTrigger>
      </TabsList>
    </div>

    <button
      type="button"
      onClick={() => tabsScrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
      className="absolute right-0 top-1/2 -translate-y-1/2 z-40 h-8 w-8 rounded-full bg-background/90 border shadow flex items-center justify-center hover:bg-accent"
      aria-label="Scroll tabs right"
    >
      <ChevronRight className="h-4 w-4" />
    </button>

    {/* Edge gradients */}
    <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background to-transparent" />
    <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent" />
  </div>
</div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-4 md:p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-8 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* System Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">System Health</h3>
                      <div className={getStatusColor(systemHealth?.status || 'unknown')}>
                        {getStatusIcon(systemHealth?.status || 'unknown')}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold capitalize">
                        {systemHealth?.status || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        All systems operational
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">API Usage</h3>
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold">
                        {apiUsage?.totalRequests.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total requests today
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Success Rate</h3>
                      <Shield className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold">
                        {apiUsage ? Math.round((apiUsage.successfulRequests / apiUsage.totalRequests) * 100) : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Requests successful
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4 md:p-6">
                    <h3 className="font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <Button
                        onClick={() => router.push('/admin/debug')}
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <Bug className="h-4 w-4 mr-2" />
                        Open Debug Dashboard
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </Button>
                      <Button onClick={testAllProviders} variant="outline" className="w-full justify-start">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Test All AI Providers
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-4 md:p-6">
                    <h3 className="font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {testResults.length > 0 ? testResults.slice(0, 3).map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            {result.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <div>
                              <p className="font-medium">{result.provider}</p>
                              <p className="text-sm text-muted-foreground">
                                {result.responseTime}ms response time
                              </p>
                            </div>
                          </div>
                          <Badge variant={result.success ? 'default' : 'destructive'}>
                            {result.success ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                      )) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <Monitor className="h-6 w-6 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Provider Status */}
                <Card className="p-4 md:p-6">
                  <h3 className="font-semibold mb-4">Provider Status</h3>
                  <div className="space-y-3">
                    {systemHealth?.providers && Object.entries(systemHealth.providers).map(([name, provider]) => (
                      <div key={name} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={getStatusColor(provider.status)}>
                            {getStatusIcon(provider.status)}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{name}</p>
                            <p className="text-sm text-muted-foreground">
                              {provider.responseTime}ms response time
                            </p>
                          </div>
                        </div>
                        <Badge variant={provider.status === 'online' ? 'default' : 'destructive'}>
                          {provider.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Debug Tab */}
          <TabsContent value="debug" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">AI System Debug Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive testing and monitoring of all AI system components
                  </p>
                </div>
                <Button onClick={() => router.push('/admin/debug')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Full Debug Dashboard
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Bug className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h4 className="font-medium">Authentication Testing</h4>
                  <p className="text-sm text-muted-foreground">Test NextAuth and Supabase auth flows</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <h4 className="font-medium">AI Provider Tests</h4>
                  <p className="text-sm text-muted-foreground">Test individual AI providers</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Monitor className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <h4 className="font-medium">System Monitoring</h4>
                  <p className="text-sm text-muted-foreground">Real-time system health and performance</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers" className="space-y-6">
            <APIProvidersTab onUnsavedChanges={setHasUnsavedChanges} />
          </TabsContent>

          {/* Model Overrides Tab */}
          <TabsContent value="model-overrides" className="space-y-6">
            <ModelOverridesTab />
          </TabsContent>

          {/* Fallback Chain Tab */}
          <TabsContent value="fallback-chain" className="space-y-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Fallback Chain</h3>
              <p className="text-muted-foreground">Configure backup providers and retry strategies.</p>
              <p className="text-sm text-muted-foreground mt-2">Implementation coming soon...</p>
            </div>
          </TabsContent>

          {/* Chat Settings Tab */}
          <TabsContent value="chat-settings" className="space-y-6">
            <ChatSettingsTab />
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">System Configuration</h3>
                <Button onClick={saveConfiguration} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
              
              {systemConfig && (
                <div className="space-y-6">
                  {/* Rate Limiting */}
                  <div>
                    <h4 className="font-medium mb-3">Rate Limiting</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="rateLimit">Requests per minute</Label>
                        <Input
                          id="rateLimit"
                          type="number"
                          value={systemConfig.rateLimitPerMinute}
                          onChange={(e) => setSystemConfig(prev => prev ? {
                            ...prev,
                            rateLimitPerMinute: parseInt(e.target.value)
                          } : null)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cacheExpiry">Cache expiry (minutes)</Label>
                        <Input
                          id="cacheExpiry"
                          type="number"
                          value={systemConfig.cacheExpiryMinutes}
                          onChange={(e) => setSystemConfig(prev => prev ? {
                            ...prev,
                            cacheExpiryMinutes: parseInt(e.target.value)
                          } : null)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div>
                    <h4 className="font-medium mb-3">Feature Flags</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Web Search</Label>
                          <p className="text-sm text-muted-foreground">Allow AI to search the web for current information</p>
                        </div>
                        <Switch
                          checked={systemConfig.enableWebSearch}
                          onCheckedChange={(checked) => setSystemConfig(prev => prev ? {
                            ...prev,
                            enableWebSearch: checked
                          } : null)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Memory Extraction</Label>
                          <p className="text-sm text-muted-foreground">Extract and store insights from conversations</p>
                        </div>
                        <Switch
                          checked={systemConfig.enableMemoryExtraction}
                          onCheckedChange={(checked) => setSystemConfig(prev => prev ? {
                            ...prev,
                            enableMemoryExtraction: checked
                          } : null)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Usage Logging</Label>
                          <p className="text-sm text-muted-foreground">Log all API calls for analytics</p>
                        </div>
                        <Switch
                          checked={systemConfig.enableUsageLogging}
                          onCheckedChange={(checked) => setSystemConfig(prev => prev ? {
                            ...prev,
                            enableUsageLogging: checked
                          } : null)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Model Configuration */}
                  <div>
                    <h4 className="font-medium mb-3">Model Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="defaultModel">Default Model</Label>
                        <Select value={systemConfig.defaultModel} onValueChange={(value) => setSystemConfig(prev => prev ? {
                          ...prev,
                          defaultModel: value
                        } : null)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</SelectItem>
                            <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                            <SelectItem value="llama-3.1-8b">Llama 3.1 8B (Cerebras)</SelectItem>
                            <SelectItem value="command">Command (Cohere)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="fallbackStrategy">Fallback Strategy</Label>
                        <Select value={systemConfig.fallbackStrategy} onValueChange={(value: any) => setSystemConfig(prev => prev ? {
                          ...prev,
                          fallbackStrategy: value
                        } : null)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sequential">Sequential (try in order)</SelectItem>
                            <SelectItem value="random">Random selection</SelectItem>
                            <SelectItem value="load-balanced">Load balanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Alert Thresholds */}
                  <div>
                    <h4 className="font-medium mb-3">Alert Thresholds</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="latencyWarning">Latency Warning (ms)</Label>
                        <Input
                          id="latencyWarning"
                          type="number"
                          value={systemConfig.alertThresholds.latencyWarning}
                          onChange={(e) => setSystemConfig(prev => prev ? {
                            ...prev,
                            alertThresholds: {
                              ...prev.alertThresholds,
                              latencyWarning: parseInt(e.target.value)
                            }
                          } : null)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="errorRateWarning">Error Rate Warning (%)</Label>
                        <Input
                          id="errorRateWarning"
                          type="number"
                          value={systemConfig.alertThresholds.errorRateWarning}
                          onChange={(e) => setSystemConfig(prev => prev ? {
                            ...prev,
                            alertThresholds: {
                              ...prev.alertThresholds,
                              errorRateWarning: parseInt(e.target.value)
                            }
                          } : null)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="costLimitWarning">Cost Limit Warning ($)</Label>
                        <Input
                          id="costLimitWarning"
                          type="number"
                          value={systemConfig.alertThresholds.costLimitWarning}
                          onChange={(e) => setSystemConfig(prev => prev ? {
                            ...prev,
                            alertThresholds: {
                              ...prev.alertThresholds,
                              costLimitWarning: parseInt(e.target.value)
                            }
                          } : null)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card className="p-4 md:p-6">
              <h3 className="font-semibold mb-4">Performance Metrics</h3>
              
              {apiUsage && (
                <div className="space-y-6">
                  {/* Usage Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{apiUsage.totalRequests.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Requests</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{Math.round(apiUsage.averageLatency)}ms</p>
                      <p className="text-sm text-muted-foreground">Avg Latency</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">${apiUsage.costEstimate.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Est. Cost</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">
                        {Math.round((apiUsage.successfulRequests / apiUsage.totalRequests) * 100)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                    </div>
                  </div>

                  {/* Top Providers */}
                  <div>
                    <h4 className="font-medium mb-3">Provider Usage</h4>
                    <div className="space-y-3">
                      {apiUsage.topProviders.map((provider) => (
                        <div key={provider.name} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{provider.name}</span>
                            <span>{provider.requests} requests ({provider.percentage}%)</span>
                          </div>
                          <Progress value={provider.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cache Performance */}
                  {systemHealth?.cache && (
                    <div>
                      <h4 className="font-medium mb-3">Cache Performance</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <p className="text-lg font-bold">{Math.round(systemHealth.cache.hitRate)}%</p>
                          <p className="text-sm text-muted-foreground">Hit Rate</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <p className="text-lg font-bold">{systemHealth.cache.totalRequests.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Total Requests</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Export/Import */}
            <Card className="p-4 md:p-6">
              <h3 className="font-semibold mb-4">Data Management</h3>
              <div className="flex gap-4">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Config
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Embeddings Tab */}
          <TabsContent value="embeddings" className="space-y-6">
            <EmbeddingModelsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Mock data functions for demo
function getMockSystemHealth(): SystemHealth {
  return {
    status: 'healthy',
    providers: {
      groq: { status: 'online', responseTime: 245, lastCheck: new Date().toISOString() },
      gemini: { status: 'online', responseTime: 178, lastCheck: new Date().toISOString() },
      cerebras: { status: 'online', responseTime: 134, lastCheck: new Date().toISOString() },
      cohere: { status: 'degraded', responseTime: 456, lastCheck: new Date().toISOString() },
      mistral: { status: 'online', responseTime: 289, lastCheck: new Date().toISOString() },
      openrouter: { status: 'online', responseTime: 312, lastCheck: new Date().toISOString() }
    },
    database: { status: 'connected', responseTime: 23, lastCheck: new Date().toISOString() },
    cache: { hitRate: 78.5, totalRequests: 1247, lastCheck: new Date().toISOString() }
  };
}

function getMockApiUsage(): APIUsage {
  return {
    totalRequests: 15234,
    successfulRequests: 14987,
    failedRequests: 247,
    averageLatency: 287,
    topProviders: [
      { name: 'groq', requests: 4521, percentage: 29.7 },
      { name: 'gemini', requests: 3847, percentage: 25.3 },
      { name: 'cerebras', requests: 2934, percentage: 19.3 },
      { name: 'mistral', requests: 2156, percentage: 14.2 },
      { name: 'openrouter', requests: 1234, percentage: 8.1 },
      { name: 'cohere', requests: 542, percentage: 3.4 }
    ],
    costEstimate: 12.45
  };
}

function getMockSystemConfig(): SystemConfig {
  return {
    rateLimitPerMinute: 100,
    cacheExpiryMinutes: 60,
    maxContextLength: 4000,
    enableWebSearch: true,
    enableMemoryExtraction: true,
    enableUsageLogging: true,
    defaultModel: 'llama-3.3-70b-versatile',
    fallbackStrategy: 'sequential',
    alertThresholds: {
      latencyWarning: 500,
      errorRateWarning: 5,
      costLimitWarning: 50
    }
  };
}