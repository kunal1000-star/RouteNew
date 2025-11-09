"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Loader2, 
  Shield,
  Brain,
  Search,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { useHallucinationPrevention, LayerStatus } from '@/contexts/HallucinationPreventionContext';
import { cn } from '@/lib/utils';

interface LayerStatusIndicatorsProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

const layerIcons = {
  1: Shield,           // Input Validation
  2: Brain,            // Context Management
  3: Search,           // Response Validation
  4: MessageSquare,    // User Feedback
  5: BarChart3,        // Quality Monitoring
};

const layerColors = {
  1: 'bg-blue-500',
  2: 'bg-purple-500', 
  3: 'bg-green-500',
  4: 'bg-orange-500',
  5: 'bg-red-500',
};

export const LayerStatusIndicators: React.FC<LayerStatusIndicatorsProps> = ({
  className,
  showDetails = true,
  compact = false,
}) => {
  const { state } = useHallucinationPrevention();
  const { layerStatuses, isProcessing, currentLayer } = state;

  const getStatusIcon = (status: LayerStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: LayerStatus['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'pending':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const formatProcessingTime = (ms?: number) => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {layerStatuses.map((layer, index) => {
          const Icon = layerIcons[layer.layer];
          return (
            <div
              key={layer.layer}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md border",
                getStatusColor(layer.status)
              )}
              title={`Layer ${layer.layer}: ${layer.name} - ${layer.status}`}
            >
              <Icon className="h-3 w-3" />
              {layer.status === 'processing' && (
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={cn("p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          5-Layer Processing Status
        </h3>
        {isProcessing && (
          <Badge variant="outline" className="text-xs">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {layerStatuses.map((layer, index) => {
          const Icon = layerIcons[layer.layer];
          const isCurrentLayer = currentLayer === layer.layer;
          const isActive = layer.status === 'processing';
          const isCompleted = layer.status === 'completed';
          const isFailed = layer.status === 'failed';

          return (
            <div
              key={layer.layer}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                getStatusColor(layer.status),
                isCurrentLayer && "ring-2 ring-blue-200"
              )}
            >
              {/* Layer Icon and Number */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                    layerColors[layer.layer]
                  )}
                >
                  {layer.layer}
                </div>
                <Icon className="h-4 w-4 text-gray-600" />
              </div>

              {/* Layer Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{layer.name}</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(layer.status)}
                    <Badge
                      variant={isCompleted ? "default" : isFailed ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {layer.status}
                    </Badge>
                  </div>
                </div>

                {/* Confidence Score */}
                {layer.confidence !== undefined && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <div className="flex-1 max-w-20">
                      <Progress value={layer.confidence * 100} className="h-1" />
                    </div>
                    <span className="text-xs font-medium">
                      {Math.round(layer.confidence * 100)}%
                    </span>
                  </div>
                )}

                {/* Processing Time */}
                {layer.processingTime && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Time:</span>
                    <span className="text-xs font-medium">
                      {formatProcessingTime(layer.processingTime)}
                    </span>
                  </div>
                )}

                {/* Details */}
                {showDetails && layer.details && (
                  <div className="mt-1">
                    <p className="text-xs text-muted-foreground">{layer.details}</p>
                  </div>
                )}

                {/* Processing Indicator */}
                {isActive && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">
                      {layer.layer === 1 && "Sanitizing input..."}
                      {layer.layer === 2 && "Building context..."}
                      {layer.layer === 3 && "Validating response..."}
                      {layer.layer === 4 && "Collecting feedback..."}
                      {layer.layer === 5 && "Monitoring quality..."}
                    </span>
                  </div>
                )}
              </div>

              {/* Results Preview */}
              {isCompleted && layer.results && showDetails && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    {layer.layer === 1 && `Score: ${Math.round(layer.results.score * 100)}%`}
                    {layer.layer === 2 && `Context: ${layer.results.contexts} sources`}
                    {layer.layer === 3 && `Quality: ${Math.round(layer.results.quality * 100)}%`}
                    {layer.layer === 4 && `Feedback: ${layer.results.feedbackCount} items`}
                    {layer.layer === 5 && `Health: ${layer.results.overallScore}%`}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Progress */}
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-muted-foreground">
            {layerStatuses.filter(l => l.status === 'completed').length} / {layerStatuses.length}
          </span>
        </div>
        <Progress 
          value={(layerStatuses.filter(l => l.status === 'completed').length / layerStatuses.length) * 100} 
          className="h-2"
        />
      </div>

      {/* Current Status Summary */}
      {isProcessing && currentLayer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            <span className="text-sm font-medium text-blue-800">
              Currently processing Layer {currentLayer}: {layerStatuses.find(l => l.layer === currentLayer)?.name}
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            The AI is applying advanced validation and quality checks to ensure accurate responses.
          </p>
        </div>
      )}
    </Card>
  );
};

export default LayerStatusIndicators;