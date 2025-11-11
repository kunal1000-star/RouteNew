// Enhanced 5-Layer Hallucination Prevention UI Components
// =======================================================
// Real-time visualization of hallucination prevention layers with status indicators,
// confidence scores, and processing metrics

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  Brain, 
  MemoryStick, 
  Search, 
  TrendingUp,
  Activity,
  Zap,
  Eye,
  Clock,
  Target,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Layer Status Types
export interface LayerStatus {
  id: number;
  name: string;
  status: 'idle' | 'processing' | 'completed' | 'error' | 'warning';
  progress: number;
  confidence: number;
  metrics: Record<string, any>;
  lastUpdated: Date;
  processingTime?: number;
  issues?: string[];
}

export interface HallucinationPreventionStatus {
  overallHealth: 'healthy' | 'warning' | 'error';
  layers: LayerStatus[];
  totalProcessingTime: number;
  confidenceScore: number;
  validationPassed: boolean;
  safetyChecks: {
    contentFiltered: boolean;
    biasChecked: boolean;
    factChecked: boolean;
    sourceVerified: boolean;
  };
  systemMetrics: {
    requestsProcessed: number;
    errorsDetected: number;
    accuracyRate: number;
    responseTime: number;
  };
}

// Real-time Layer Status Display Component
interface RealTimeLayerStatusProps {
  status: HallucinationPreventionStatus;
  isLive?: boolean;
  showMetrics?: boolean;
  className?: string;
}

export function RealTimeLayerStatus({ 
  status, 
  isLive = true, 
  showMetrics = true,
  className 
}: RealTimeLayerStatusProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getLayerIcon = (layerStatus: LayerStatus) => {
    switch (layerStatus.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <TooltipProvider>
      <div className={cn('space-y-4', className)}>
        {/* Overall Health Status */}
        <Card className={getStatusColor(status.overallHealth)}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Hallucination Prevention System</span>
                {isLive && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {Math.round(status.confidenceScore * 100)}% Confidence
                </Badge>
                <Badge variant={status.overallHealth === 'healthy' ? 'default' : 'destructive'}>
                  {status.overallHealth.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          {showMetrics && (
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">{status.systemMetrics.requestsProcessed}</div>
                  <div className="text-xs text-muted-foreground">Requests</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{Math.round(status.systemMetrics.accuracyRate * 100)}%</div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{status.systemMetrics.responseTime}ms</div>
                  <div className="text-xs text-muted-foreground">Response</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{status.systemMetrics.errorsDetected}</div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>
              
              {/* Safety Checks */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium">Safety Checks</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(status.safetyChecks).map(([check, passed]) => (
                    <div key={check} className="flex items-center space-x-1">
                      {passed ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                      <span className="text-xs capitalize">{check.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Individual Layer Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Layers className="h-4 w-4" />
              <span>Layer Processing Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status.layers.map((layer) => (
                <LayerStatusDisplay key={layer.id} layer={layer} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Processing Time Indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Total processing time: {status.totalProcessingTime}ms</span>
          <span>Last updated: {currentTime.toLocaleTimeString()}</span>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Individual Layer Status Display Component
interface LayerStatusDisplayProps {
  layer: LayerStatus;
  compact?: boolean;
}

function LayerStatusDisplay({ layer, compact = false }: LayerStatusDisplayProps) {
  const getLayerIcon = () => {
    const iconClass = "h-4 w-4";
    switch (layer.id) {
      case 1:
        return <Shield className={iconClass} />;
      case 2:
        return <Brain className={iconClass} />;
      case 3:
        return <Target className={iconClass} />;
      case 4:
        return <TrendingUp className={iconClass} />;
      case 5:
        return <Activity className={iconClass} />;
      default:
        return <div className={cn(iconClass, "bg-gray-400 rounded-full")} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2 p-2 rounded border">
              <div className="flex items-center space-x-1">
                {getLayerIcon()}
                <span className="text-xs font-medium">L{layer.id}</span>
              </div>
              <div className="flex-1">
                <Progress value={layer.progress} className="h-1" />
              </div>
              <span className="text-xs">{Math.round(layer.confidence * 100)}%</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div className="font-medium">{layer.name}</div>
              <div>Status: {layer.status}</div>
              <div>Confidence: {Math.round(layer.confidence * 100)}%</div>
              {layer.processingTime && <div>Time: {layer.processingTime}ms</div>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('p-3 rounded-lg border', getStatusColor(layer.status))}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getLayerIcon()}
          <span className="font-medium text-sm">{layer.name}</span>
          <Badge variant="outline" className="text-xs">
            L{layer.id}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          {layer.processingTime && (
            <span className="text-xs text-muted-foreground flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{layer.processingTime}ms</span>
            </span>
          )}
          <span className="text-xs font-medium">
            {Math.round(layer.confidence * 100)}%
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <Progress value={layer.progress} className="h-1" />
        
        {/* Layer-specific metrics */}
        {Object.keys(layer.metrics).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {Object.entries(layer.metrics).slice(0, 3).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                <span className="font-medium">
                  {typeof value === 'number' ? value.toFixed(2) : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Issues */}
        {layer.issues && layer.issues.length > 0 && (
          <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
            <div className="text-xs font-medium text-yellow-800 mb-1">Issues:</div>
            {layer.issues.map((issue, index) => (
              <div key={index} className="text-xs text-yellow-700">• {issue}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Confidence Score Indicator Component
interface ConfidenceScoreProps {
  score: number;
  label?: string;
  showTrend?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConfidenceScore({ 
  score, 
  label = 'Confidence', 
  showTrend = true,
  size = 'md',
  className 
}: ConfidenceScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 0.8) return 'bg-green-100';
    if (score >= 0.6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-base'
  };

  const radius = sizeClasses[size];
  const circumference = 2 * Math.PI * 18; // radius = 18
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score * circumference);

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <div className="relative">
        <svg className={cn('transform -rotate-90', radius)}>
          <circle
            cx="50%"
            cy="50%"
            r="18"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="50%"
            cy="50%"
            r="18"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={getScoreColor(score)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', getScoreColor(score), size === 'sm' ? 'text-xs' : 'text-sm')}>
            {Math.round(score * 100)}
          </span>
        </div>
      </div>
      <div>
        <div className="font-medium text-sm">{label}</div>
        {showTrend && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>Stable</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Memory References Display Component
interface MemoryReferencesProps {
  references: Array<{
    id: string;
    content: string;
    relevanceScore: number;
    type: string;
    timestamp: Date;
  }>;
  showAll?: boolean;
  className?: string;
}

export function MemoryReferencesDisplay({ 
  references, 
  showAll = false, 
  className 
}: MemoryReferencesProps) {
  const [showAllRefs, setShowAllRefs] = useState(showAll);
  
  const displayReferences = showAllRefs ? references : references.slice(0, 3);

  if (references.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <MemoryStick className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No memory references found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <MemoryStick className="h-4 w-4 text-indigo-500" />
            <span>Memory References</span>
            <Badge variant="secondary" className="text-xs">
              {references.length}
            </Badge>
          </CardTitle>
          {references.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6"
              onClick={() => setShowAllRefs(!showAllRefs)}
            >
              {showAllRefs ? 'Show Less' : 'Show All'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayReferences.map((ref) => (
            <div key={ref.id} className="p-2 bg-muted rounded text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{ref.type}</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {Math.round(ref.relevanceScore * 100)}%
                  </Badge>
                  <span className="text-muted-foreground">
                    {ref.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground line-clamp-2">
                {ref.content}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Hallucination Prevention Metrics Dashboard
interface MetricsDashboardProps {
  className?: string;
}

export function HallucinationPreventionMetrics({ className }: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState({
    layersProcessed: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    accuracyRate: 0,
    errorRate: 0,
    systemLoad: 0
  });

  useEffect(() => {
    // Simulate real-time metrics updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        layersProcessed: Math.min(5, prev.layersProcessed + Math.random() > 0.7 ? 1 : 0),
        totalRequests: prev.totalRequests + 1,
        averageResponseTime: Math.round(100 + Math.random() * 200),
        accuracyRate: 0.85 + Math.random() * 0.1,
        errorRate: Math.random() * 0.05,
        systemLoad: Math.random() * 100
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-4', className)}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{metrics.layersProcessed}/5</div>
              <div className="text-xs text-muted-foreground">Layers Processed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{metrics.averageResponseTime}ms</div>
              <div className="text-xs text-muted-foreground">Avg Response Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-purple-500" />
            <div>
              <div className="text-2xl font-bold">{Math.round(metrics.accuracyRate * 100)}%</div>
              <div className="text-xs text-muted-foreground">Accuracy Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-orange-500" />
            <div>
              <div className="text-2xl font-bold">{Math.round(metrics.systemLoad)}%</div>
              <div className="text-xs text-muted-foreground">System Load</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-cyan-500" />
            <div>
              <div className="text-2xl font-bold">{metrics.totalRequests}</div>
              <div className="text-xs text-muted-foreground">Total Requests</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <div>
              <div className="text-2xl font-bold">{Math.round(metrics.errorRate * 100)}%</div>
              <div className="text-xs text-muted-foreground">Error Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export all components
export {
  RealTimeLayerStatus,
  LayerStatusDisplay,
  ConfidenceScore,
  MemoryReferencesDisplay,
  HallucinationPreventionMetrics
};