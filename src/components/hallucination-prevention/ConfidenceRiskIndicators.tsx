"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Info,
  Eye,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useHallucinationPrevention } from '@/contexts/HallucinationPreventionContext';
import { cn } from '@/lib/utils';

interface ConfidenceRiskIndicatorsProps {
  confidence: number;
  hallucinationRisk: 'low' | 'medium' | 'high';
  factCheckStatus: 'verified' | 'unverified' | 'disputed';
  className?: string;
  showDetailedBreakdown?: boolean;
  interactive?: boolean;
  onShowDetails?: () => void;
}

export const ConfidenceRiskIndicators: React.FC<ConfidenceRiskIndicatorsProps> = ({
  confidence,
  hallucinationRisk,
  factCheckStatus,
  className,
  showDetailedBreakdown = true,
  interactive = true,
  onShowDetails,
}) => {
  // Confidence meter configuration
  const getConfidenceLevel = (conf: number) => {
    if (conf >= 0.9) return { level: 'Very High', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    if (conf >= 0.8) return { level: 'High', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    if (conf >= 0.6) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    if (conf >= 0.4) return { level: 'Low', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
    return { level: 'Very Low', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
  };

  // Risk indicator configuration
  const getRiskConfig = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return {
          icon: Shield,
          label: 'Low Risk',
          description: 'High confidence in accuracy and reliability',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          progressColor: 'bg-green-500'
        };
      case 'medium':
        return {
          icon: AlertTriangle,
          label: 'Medium Risk',
          description: 'Some uncertainty detected, verification recommended',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          progressColor: 'bg-yellow-500'
        };
      case 'high':
        return {
          icon: AlertTriangle,
          label: 'High Risk',
          description: 'Significant risk of inaccuracies, verification required',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          progressColor: 'bg-red-500'
        };
    }
  };

  // Fact check status configuration
  const getFactCheckConfig = (status: 'verified' | 'unverified' | 'disputed') => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle2,
          label: 'Verified',
          description: 'All facts confirmed against reliable sources',
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'unverified':
        return {
          icon: Info,
          label: 'Unverified',
          description: 'Some facts require additional verification',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50'
        };
      case 'disputed':
        return {
          icon: XCircle,
          label: 'Disputed',
          description: 'Conflicting information detected in sources',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
    }
  };

  const confidenceConfig = getConfidenceLevel(confidence);
  const riskConfig = getRiskConfig(hallucinationRisk);
  const factCheckConfig = getFactCheckConfig(factCheckStatus);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Confidence Meter */}
      <Card className={cn("p-4", confidenceConfig.bgColor, confidenceConfig.borderColor)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className={cn("h-4 w-4", confidenceConfig.color)} />
            <span className="font-medium text-sm">AI Confidence</span>
          </div>
          <Badge 
            variant="outline" 
            className={cn("font-medium", confidenceConfig.color)}
          >
            {confidenceConfig.level}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Confidence Level</span>
            <span className={cn("font-medium", confidenceConfig.color)}>
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <Progress 
            value={confidence * 100} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {confidence >= 0.8 && "High confidence in the accuracy of this response."}
            {confidence >= 0.6 && confidence < 0.8 && "Moderate confidence - some uncertainty present."}
            {confidence < 0.6 && "Low confidence - significant uncertainty detected."}
          </p>
        </div>
      </Card>

      {/* Hallucination Risk Indicator */}
      <Card className={cn("p-4", riskConfig.bgColor, riskConfig.borderColor)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <riskConfig.icon className={cn("h-4 w-4", riskConfig.color)} />
            <span className="font-medium text-sm">Hallucination Risk</span>
          </div>
          <Badge 
            variant="outline" 
            className={cn("font-medium", riskConfig.color)}
          >
            {riskConfig.label}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Risk Assessment</span>
            <div className="flex items-center gap-2">
              {interactive && onShowDetails && (
                <button
                  onClick={onShowDetails}
                  className="text-xs underline hover:no-underline"
                >
                  View Details
                </button>
              )}
            </div>
          </div>
          <Progress 
            value={hallucinationRisk === 'low' ? 100 : hallucinationRisk === 'medium' ? 60 : 20} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {riskConfig.description}
          </p>
        </div>
      </Card>

      {/* Fact Check Status */}
      <Card className={cn("p-4", factCheckConfig.bgColor)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <factCheckConfig.icon className={cn("h-4 w-4", factCheckConfig.color)} />
            <span className="font-medium text-sm">Fact Verification</span>
          </div>
          <Badge 
            variant="outline" 
            className={cn("font-medium", factCheckConfig.color)}
          >
            {factCheckConfig.label}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {factCheckConfig.description}
          </p>
          
          {showDetailedBreakdown && (
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {factCheckStatus === 'verified' ? '✓' : '○'}
                </div>
                <div className="text-xs text-muted-foreground">Verified</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">
                  {factCheckStatus === 'unverified' ? '?' : '○'}
                </div>
                <div className="text-xs text-muted-foreground">Unverified</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {factCheckStatus === 'disputed' ? '⚠' : '○'}
                </div>
                <div className="text-xs text-muted-foreground">Disputed</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* High Risk Alert */}
      {hallucinationRisk === 'high' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>High Risk Detected:</strong> This response may contain inaccuracies. 
            Please verify important information and consider consulting additional sources.
          </AlertDescription>
        </Alert>
      )}

      {/* Medium Risk Advisory */}
      {hallucinationRisk === 'medium' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Medium Risk:</strong> Some uncertainty detected. 
            Consider verifying key facts and figures before relying on this information.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      {interactive && (
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => window.open('/help/confidence-scoring', '_blank')}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Learn about confidence scores
          </button>
          <span className="text-xs text-muted-foreground">•</span>
          <button
            onClick={() => window.open('/help/hallucination-prevention', '_blank')}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            How we prevent hallucinations
          </button>
        </div>
      )}
    </div>
  );
};

export default ConfidenceRiskIndicators;