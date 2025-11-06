// Enhanced Real-Time Analytics Dashboard Component
// ================================================

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  useProviderStatus,
  useSystemHealth,
  useRateLimits,
  useFallbackEvents,
  useRealtimeDashboard
} from '@/hooks/use-realtime-dashboard';
import {
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';

export default function EnhancedAnalyticsDashboard() {
  const [isVisible, setIsVisible] = useState(true);

  // WebSocket hooks for real-time data
  const { 
    isConnected, 
    isConnecting, 
    lastMessage, 
    connectionStatus,
    error: wsError,
    requestUpdate 
  } = useRealtimeDashboard({
    autoConnect: true,
    subscribedChannels: ['all']
  });

  const { providerStatus } = useProviderStatus();
  const { systemHealth } = useSystemHealth();
  const { rateLimitWarnings } = useRateLimits();
  const { fallbackEvents } = useFallbackEvents();

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-4 w-4" />;
      case 'connecting': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error': return <WifiOff className="h-4 w-4" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700"
          size="icon"
        >
          <Eye className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg z-40 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Real-Time Analytics
          </h3>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="icon"
            className="h-6 w-6"
          >
            <EyeOff className="h-3 w-3" />
          </Button>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${getConnectionStatusColor()}`}>
            {getConnectionStatusIcon()}
            <span className="text-xs font-medium">
              {connectionStatus === 'connected' ? 'Live' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 
               connectionStatus === 'error' ? 'Error' : 'Disconnected'}
            </span>
          </div>

          <Button
            onClick={() => requestUpdate()}
            disabled={!isConnected}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* System Health Summary */}
        {systemHealth && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge 
                  variant={systemHealth.overallStatus === 'operational' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {systemHealth.overallStatus}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg Response</span>
                <span className="text-xs font-medium">
                  {systemHealth.averageResponseTime}ms
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Cache Hit Rate</span>
                  <span className="text-xs font-medium">
                    {systemHealth.cacheHitRate}%
                  </span>
                </div>
                <Progress value={systemHealth.cacheHitRate} className="h-1" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Provider Status Cards */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Provider Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {providerStatus.map((provider, index) => (
              <div key={index} className="p-2 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{provider.icon}</span>
                    <span className="text-sm font-medium">{provider.name}</span>
                  </div>
                  <Badge 
                    variant={
                      provider.status === 'healthy' ? 'default' :
                      provider.status === 'caution' ? 'secondary' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {provider.status}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Usage</span>
                    <span className="text-xs font-medium">
                      {provider.usage}/{provider.limit}
                    </span>
                  </div>
                  <Progress 
                    value={provider.percentage} 
                    className="h-1"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Rate Limit Warnings */}
        {rateLimitWarnings.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Rate Limit Warnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rateLimitWarnings.map((warning, index) => (
                <div key={index} className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded text-xs">
                  <div className="font-medium text-orange-900 dark:text-orange-100">
                    {warning.provider}
                  </div>
                  <div className="text-orange-700 dark:text-orange-300">
                    {warning.usage}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
