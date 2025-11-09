"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Server, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useHallucinationPrevention, SystemHealth, Alert } from '@/contexts/HallucinationPreventionContext';
import { cn } from '@/lib/utils';

interface SystemHealthDashboardProps {
  className?: string;
  compact?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

export const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({
  className,
  compact = false,
  autoRefresh = true,
  refreshInterval = 30,
}) => {
  const { state, actions } = useHallucinationPrevention();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const systemHealth = state.systemHealth;

  useEffect(() => {
    if (autoRefresh && systemHealth === null) {
      // Initial load
      refreshHealth();
    }
  }, [autoRefresh]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refreshHealth, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const refreshHealth = async () => {
    setIsRefreshing(true);
    try {
      await actions.getSystemHealth();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh system health:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getProviderStatusColor = (healthy: boolean) => {
    return healthy ? 'text-green-600' : 'text-red-600';
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (24 * 60 * 60));
    const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatLatency = (latency: number) => {
    if (latency < 1000) return `${latency}ms`;
    return `${(latency / 1000).toFixed(1)}s`;
  };

  if (!systemHealth) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading system health...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">System Health</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(systemHealth.status)}
            <Badge variant="outline" className={cn("text-xs", getStatusColor(systemHealth.status))}>
              {systemHealth.status}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshHealth}
              disabled={isRefreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Latency:</span>
            <span>{formatLatency(systemHealth.latency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uptime:</span>
            <span>{formatUptime(systemHealth.uptime)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <h3 className="font-medium text-sm">System Health</h3>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshHealth}
            disabled={isRefreshing}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div className="flex items-center gap-3">
          {getStatusIcon(systemHealth.status)}
          <div>
            <div className="font-medium text-sm">Overall Status</div>
            <div className="text-xs text-muted-foreground">
              {systemHealth.status === 'healthy' && "All systems operating normally"}
              {systemHealth.status === 'warning' && "Some components experiencing issues"}
              {systemHealth.status === 'critical' && "Critical system issues detected"}
            </div>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={cn("font-medium", getStatusColor(systemHealth.status))}
        >
          {systemHealth.status.toUpperCase()}
        </Badge>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Response Latency</span>
            </div>
            <span className="text-sm font-medium">
              {formatLatency(systemHealth.latency)}
            </span>
          </div>
          <Progress 
            value={Math.max(0, Math.min(100, 100 - (systemHealth.latency / 50)))} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {systemHealth.latency < 1000 ? "Excellent" : 
             systemHealth.latency < 2000 ? "Good" : 
             systemHealth.latency < 5000 ? "Fair" : "Poor"} performance
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">System Uptime</span>
            </div>
            <span className="text-sm font-medium">
              {formatUptime(systemHealth.uptime)}
            </span>
          </div>
          <Progress 
            value={Math.min(100, (systemHealth.uptime / (24 * 60 * 60)) * 100)} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            Time since last restart
          </p>
        </div>
      </div>

      {/* Provider Health */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Server className="h-4 w-4" />
          AI Provider Status
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(systemHealth.providerHealth).map(([provider, healthy]) => (
            <div
              key={provider}
              className="flex items-center justify-between p-2 rounded border"
            >
              <span className="text-sm capitalize">{provider}</span>
              <div className="flex items-center gap-1">
                {healthy ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span className={cn("text-xs font-medium", getProviderStatusColor(healthy))}>
                  {healthy ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Processing Queue */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Processing Queue</span>
          <span className="text-sm font-medium">
            {systemHealth.processingQueue} pending
          </span>
        </div>
        <Progress 
          value={Math.min(100, (systemHealth.processingQueue / 10) * 100)} 
          className="h-2"
        />
        {systemHealth.processingQueue > 5 && (
          <p className="text-xs text-yellow-600">
            High queue volume may cause delays
          </p>
        )}
      </div>

      {/* Active Alerts */}
      {systemHealth.activeAlerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Active Alerts
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {systemHealth.activeAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-2 rounded border text-xs",
                  alert.severity === 'critical' && "border-red-200 bg-red-50",
                  alert.severity === 'high' && "border-orange-200 bg-orange-50",
                  alert.severity === 'medium' && "border-yellow-200 bg-yellow-50",
                  alert.severity === 'low' && "border-blue-200 bg-blue-50"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      alert.severity === 'critical' && "border-red-300 text-red-700",
                      alert.severity === 'high' && "border-orange-300 text-orange-700",
                      alert.severity === 'medium' && "border-yellow-300 text-yellow-700",
                      alert.severity === 'low' && "border-blue-300 text-blue-700"
                    )}
                  >
                    {alert.severity}
                  </Badge>
                  <span className="text-muted-foreground">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="font-medium">{alert.message}</p>
              </div>
            ))}
            {systemHealth.activeAlerts.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                +{systemHealth.activeAlerts.length - 5} more alerts
              </p>
            )}
          </div>
        </div>
      )}

      {/* Performance Trends */}
      <div className="pt-2 border-t space-y-2">
        <h4 className="text-sm font-medium">Quick Actions</h4>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshHealth}
            disabled={isRefreshing}
            className="flex-1"
          >
            <RefreshCw className={cn("h-3 w-3 mr-1", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/admin/system-health', '_blank')}
            className="flex-1"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Details
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SystemHealthDashboard;