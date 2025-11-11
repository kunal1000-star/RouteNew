// Real-time Layer Status Visualization
// =====================================
// UI component that shows 5-layer hallucination prevention status in real-time
// Makes the hallucination prevention system visible and functional to users

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  Brain, 
  Eye, 
  Database, 
  Zap,
  Info,
  AlertCircle
} from 'lucide-react';

export interface LayerStatus {
  layer: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  status: 'idle' | 'processing' | 'complete' | 'warning' | 'error';
  progress: number; // 0-100
  processingTime: number; // in milliseconds
  confidence: number; // 0-1
  issues: string[];
  lastUpdate: Date;
  icon: React.ReactNode;
  color: string;
  metrics: {
    accuracy?: number;
    memoryUsed?: number;
    validationTime?: number;
    personalizationScore?: number;
    systemHealth?: number;
  };
}

export interface HallucinationPreventionStatus {
  overall: {
    status: 'healthy' | 'degraded' | 'critical';
    confidence: number;
    processingTime: number;
    layersActive: number;
    totalLayers: number;
  };
  layers: LayerStatus[];
  metrics: {
    totalQueries: number;
    blockedQueries: number;
    accuracyRate: number;
    averageResponseTime: number;
    userSatisfaction: number;
  };
  alerts: Array<{
    type: 'info' | 'warning' | 'error';
    message: string;
    layer?: number;
    timestamp: Date;
  }>;
}

export interface LayerStatusVisualizationProps {
  status: HallucinationPreventionStatus;
  isVisible: boolean;
  onToggleVisibility?: (visible: boolean) => void;
  theme?: 'compact' | 'detailed' | 'minimal';
  position?: 'sidebar' | 'overlay' | 'bottom';
  showMetrics?: boolean;
}

export const LayerStatusVisualization: React.FC<LayerStatusVisualizationProps> = ({
  status,
  isVisible,
  onToggleVisibility,
  theme = 'detailed',
  position = 'sidebar',
  showMetrics = true
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMinimized, setIsMinimized] = useState(false);

  // Layer definitions with descriptions
  const layerDefinitions = {
    1: {
      name: 'Input Validation & Safety',
      description: 'Filters harmful content and validates input safety',
      icon: <Shield className="h-4 w-4" />,
      color: 'bg-blue-500',
      purpose: 'Prevents malicious or harmful queries from reaching the system'
    },
    2: {
      name: 'Memory & Context Building',
      description: 'Builds conversation context and retrieves relevant memories',
      icon: <Database className="h-4 w-4" />,
      color: 'bg-green-500',
      purpose: 'Maintains conversation coherence and uses relevant context'
    },
    3: {
      name: 'Response Validation & Fact-Checking',
      description: 'Validates generated responses for accuracy and coherence',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'bg-purple-500',
      purpose: 'Ensures responses are factually accurate and logically consistent'
    },
    4: {
      name: 'Personalization Engine',
      description: 'Adapts responses based on user preferences and history',
      icon: <Brain className="h-4 w-4" />,
      color: 'bg-orange-500',
      purpose: 'Provides personalized and relevant responses to users'
    },
    5: {
      name: 'System Monitoring & Compliance',
      description: 'Monitors system health and ensures compliance standards',
      icon: <Activity className="h-4 w-4" />,
      color: 'bg-red-500',
      purpose: 'Maintains system reliability and regulatory compliance'
    }
  };

  const getStatusIcon = (status: LayerStatus['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status: LayerStatus['status']) => {
    switch (status) {
      case 'complete':
        return 'border-green-200 bg-green-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getOverallStatusColor = (status: HallucinationPreventionStatus['overall']['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => onToggleVisibility?.(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        title="Show Hallucination Prevention Status"
      >
        <Shield className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className={`fixed ${position === 'sidebar' ? 'top-4 right-4 w-80' : position === 'bottom' ? 'bottom-4 left-4 right-4' : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96'} z-50`}>
      <Card className="shadow-2xl border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Hallucination Prevention
              <Badge className={getOverallStatusColor(status.overall.status)}>
                {status.overall.status}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isMinimized ? '▼' : '▲'}
              </button>
              <button
                onClick={() => onToggleVisibility?.(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3">
                <OverallStatus status={status.overall} />
                <RecentAlerts alerts={status.alerts} />
                <QuickLayerStatus layers={status.layers} />
              </TabsContent>

              <TabsContent value="layers" className="space-y-3">
                {status.layers.map((layer) => (
                  <LayerCard
                    key={layer.layer}
                    layer={layer}
                    definition={layerDefinitions[layer.layer]}
                    theme={theme}
                  />
                ))}
              </TabsContent>

              <TabsContent value="metrics" className="space-y-3">
                {showMetrics && <SystemMetrics metrics={status.metrics} />}
                <PerformanceChart layers={status.layers} />
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

// Component: Overall Status Summary
const OverallStatus: React.FC<{ status: HallucinationPreventionStatus['overall'] }> = ({ status }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">System Status</span>
        <span className="text-sm text-gray-500">
          {status.layersActive}/{status.totalLayers} layers active
        </span>
      </div>
      <Progress value={(status.layersActive / status.totalLayers) * 100} className="h-2" />
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Confidence: {(status.confidence * 100).toFixed(1)}%</span>
        <span>Response Time: {status.processingTime}ms</span>
      </div>
    </div>
  );
};

// Component: Recent Alerts
const RecentAlerts: React.FC<{ alerts: HallucinationPreventionStatus['alerts'] }> = ({ alerts }) => {
  const recentAlerts = alerts.slice(0, 3);

  if (recentAlerts.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          All systems operating normally
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Recent Alerts</h4>
      {recentAlerts.map((alert, index) => (
        <Alert key={index} className="py-2">
          {alert.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {alert.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
          {alert.type === 'info' && <Info className="h-4 w-4" />}
          <AlertDescription className="text-sm">
            {alert.message}
            {alert.layer && (
              <Badge variant="outline" className="ml-2 text-xs">
                Layer {alert.layer}
              </Badge>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

// Component: Quick Layer Status
const QuickLayerStatus: React.FC<{ layers: LayerStatus[] }> = ({ layers }) => {
  return (
    <div className="grid grid-cols-5 gap-1">
      {layers.map((layer) => (
        <div
          key={layer.layer}
          className={`p-2 rounded text-center ${getStatusColor(layer.status)}`}
        >
          <div className="text-xs font-bold">{layer.layer}</div>
          {getStatusIcon(layer.status)}
        </div>
      ))}
    </div>
  );
};

// Component: Individual Layer Card
const LayerCard: React.FC<{
  layer: LayerStatus;
  definition: typeof layerDefinitions[1];
  theme: 'compact' | 'detailed' | 'minimal';
}> = ({ layer, definition, theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (theme === 'minimal') {
    return (
      <div className={`p-3 rounded-lg border ${getStatusColor(layer.status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {definition.icon}
            <span className="text-sm font-medium">Layer {layer.layer}</span>
          </div>
          {getStatusIcon(layer.status)}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor(layer.status)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {definition.icon}
          <div>
            <h4 className="text-sm font-semibold">{definition.name}</h4>
            <p className="text-xs text-gray-600">{definition.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {(layer.confidence * 100).toFixed(0)}%
          </Badge>
          {getStatusIcon(layer.status)}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span>Progress</span>
          <span>{layer.processingTime}ms</span>
        </div>
        <Progress value={layer.progress} className="h-1" />
        
        {layer.issues.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-orange-600 mb-1">Issues:</p>
            <ul className="text-xs text-orange-600 space-y-1">
              {layer.issues.map((issue, index) => (
                <li key={index} className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {theme === 'detailed' && layer.metrics && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Hide' : 'Show'} details
          </button>
        )}

        {isExpanded && layer.metrics && (
          <div className="mt-2 p-2 bg-white rounded border space-y-1">
            {Object.entries(layer.metrics).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                <span>{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Component: System Metrics
const SystemMetrics: React.FC<{ metrics: HallucinationPreventionStatus['metrics'] }> = ({ metrics }) => {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">System Metrics</h4>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{metrics.totalQueries}</div>
          <div className="text-xs text-gray-600">Total Queries</div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{metrics.blockedQueries}</div>
          <div className="text-xs text-gray-600">Blocked</div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{(metrics.accuracyRate * 100).toFixed(1)}%</div>
          <div className="text-xs text-gray-600">Accuracy</div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{metrics.averageResponseTime}ms</div>
          <div className="text-xs text-gray-600">Avg Response</div>
        </div>
      </div>
      
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">User Satisfaction</span>
          <span className="text-sm text-gray-600">{(metrics.userSatisfaction * 100).toFixed(1)}%</span>
        </div>
        <Progress value={metrics.userSatisfaction * 100} className="h-2" />
      </div>
    </div>
  );
};

// Component: Performance Chart (simplified visualization)
const PerformanceChart: React.FC<{ layers: LayerStatus[] }> = ({ layers }) => {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Layer Performance</h4>
      
      <div className="space-y-2">
        {layers.map((layer) => (
          <div key={layer.layer} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Layer {layer.layer}</span>
              <span>{layer.processingTime}ms</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${layer.status === 'error' ? 'bg-red-500' : 
                           layer.status === 'warning' ? 'bg-yellow-500' : 
                           'bg-green-500'}`}
                style={{ width: `${Math.min(100, (layer.processingTime / 1000) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Hook for managing layer status updates
export const useLayerStatus = (userId: string) => {
  const [status, setStatus] = useState<HallucinationPreventionStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStatus(generateMockStatus());
    }, 2000);

    setIsConnected(true);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [userId]);

  return { status, isConnected };
};

// Mock data generator for demonstration
const generateMockStatus = (): HallucinationPreventionStatus => {
  const layers: LayerStatus[] = [1, 2, 3, 4, 5].map((layerNum) => ({
    layer: layerNum as 1 | 2 | 3 | 4 | 5,
    name: `Layer ${layerNum}`,
    description: `Description for layer ${layerNum}`,
    status: Math.random() > 0.8 ? 'processing' : Math.random() > 0.9 ? 'warning' : 'complete',
    progress: Math.random() * 100,
    processingTime: Math.floor(Math.random() * 500) + 50,
    confidence: Math.random() * 0.3 + 0.7,
    issues: Math.random() > 0.9 ? ['Minor delay detected'] : [],
    lastUpdate: new Date(),
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-blue-500',
    metrics: {
      accuracy: Math.random() * 0.2 + 0.8,
      memoryUsed: Math.random() * 100,
      validationTime: Math.random() * 200 + 50,
      personalizationScore: Math.random() * 0.3 + 0.7,
      systemHealth: Math.random() * 0.2 + 0.8
    }
  }));

  return {
    overall: {
      status: Math.random() > 0.9 ? 'critical' : Math.random() > 0.7 ? 'degraded' : 'healthy',
      confidence: Math.random() * 0.3 + 0.7,
      processingTime: layers.reduce((sum, layer) => sum + layer.processingTime, 0),
      layersActive: layers.filter(l => l.status !== 'idle').length,
      totalLayers: layers.length
    },
    layers,
    metrics: {
      totalQueries: Math.floor(Math.random() * 1000) + 500,
      blockedQueries: Math.floor(Math.random() * 50) + 10,
      accuracyRate: Math.random() * 0.1 + 0.9,
      averageResponseTime: Math.floor(Math.random() * 200) + 300,
      userSatisfaction: Math.random() * 0.3 + 0.7
    },
    alerts: Math.random() > 0.8 ? [{
      type: 'warning' as const,
      message: 'Layer 3 processing slightly slower than usual',
      layer: 3,
      timestamp: new Date()
    }] : []
  };
};

export default LayerStatusVisualization;