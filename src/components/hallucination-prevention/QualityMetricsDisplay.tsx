"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  BookOpen,
  Award,
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';
import { useHallucinationPrevention, QualityMetrics } from '@/contexts/HallucinationPreventionContext';
import { cn } from '@/lib/utils';

interface QualityMetricsDisplayProps {
  metrics: QualityMetrics;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
  showEducationalEffectiveness?: boolean;
}

export const QualityMetricsDisplay: React.FC<QualityMetricsDisplayProps> = ({
  metrics,
  className,
  showDetails = true,
  compact = false,
  showEducationalEffectiveness = true,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-blue-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.9) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (score >= 0.7) return <Target className="h-4 w-4 text-blue-500" />;
    if (score >= 0.5) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getRiskIcon = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return <Shield className="h-4 w-4 text-green-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getFactCheckColor = (status: 'verified' | 'unverified' | 'disputed') => {
    switch (status) {
      case 'verified': return 'text-green-600';
      case 'unverified': return 'text-yellow-600';
      case 'disputed': return 'text-red-600';
    }
  };

  const getEducationalEffectivenessLevel = (score: number) => {
    if (score >= 0.9) return { label: 'Excellent', icon: Award, color: 'text-purple-600' };
    if (score >= 0.8) return { label: 'Very Good', icon: TrendingUp, color: 'text-blue-600' };
    if (score >= 0.7) return { label: 'Good', icon: BookOpen, color: 'text-green-600' };
    if (score >= 0.6) return { label: 'Fair', icon: Brain, color: 'text-yellow-600' };
    return { label: 'Needs Improvement', icon: AlertTriangle, color: 'text-red-600' };
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{Math.round(metrics.overall * 100)}%</span>
        </div>
        <div className={cn("px-2 py-1 rounded-full text-xs font-medium border", getRiskColor(metrics.hallucinationRisk))}>
          {metrics.hallucinationRisk} risk
        </div>
        {metrics.confidence && (
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">{Math.round(metrics.confidence * 100)}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Quality Analysis
        </h3>
        <Badge 
          variant="outline" 
          className={cn("font-medium", getScoreColor(metrics.overall))}
        >
          {Math.round(metrics.overall * 100)}% Overall
        </Badge>
      </div>

      {/* Main Quality Scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          {/* Overall Quality */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Quality</span>
              {getScoreIcon(metrics.overall)}
            </div>
            <Progress value={metrics.overall * 100} className="h-2" />
            <span className={cn("text-xs font-medium", getScoreColor(metrics.overall))}>
              {Math.round(metrics.overall * 100)}%
            </span>
          </div>

          {/* Factual Accuracy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Factual Accuracy</span>
              {getScoreIcon(metrics.factual)}
            </div>
            <Progress value={metrics.factual * 100} className="h-2" />
            <span className={cn("text-xs font-medium", getScoreColor(metrics.factual))}>
              {Math.round(metrics.factual * 100)}%
            </span>
          </div>

          {/* Logical Consistency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Logical Consistency</span>
              {getScoreIcon(metrics.logical)}
            </div>
            <Progress value={metrics.logical * 100} className="h-2" />
            <span className={cn("text-xs font-medium", getScoreColor(metrics.logical))}>
              {Math.round(metrics.logical * 100)}%
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Completeness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Completeness</span>
              {getScoreIcon(metrics.complete)}
            </div>
            <Progress value={metrics.complete * 100} className="h-2" />
            <span className={cn("text-xs font-medium", getScoreColor(metrics.complete))}>
              {Math.round(metrics.complete * 100)}%
            </span>
          </div>

          {/* Consistency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Response Relevance</span>
              {getScoreIcon(metrics.consistent)}
            </div>
            <Progress value={metrics.consistent * 100} className="h-2" />
            <span className={cn("text-xs font-medium", getScoreColor(metrics.consistent))}>
              {Math.round(metrics.consistent * 100)}%
            </span>
          </div>

          {/* Confidence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">AI Confidence</span>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            <Progress value={metrics.confidence * 100} className="h-2" />
            <span className={cn("text-xs font-medium", getScoreColor(metrics.confidence))}>
              {Math.round(metrics.confidence * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Risk Assessment</h4>
        <div className="flex items-center gap-3 p-3 rounded-lg border">
          {getRiskIcon(metrics.hallucinationRisk)}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Hallucination Risk</span>
              <Badge 
                variant="outline" 
                className={cn("text-xs", getRiskColor(metrics.hallucinationRisk))}
              >
                {metrics.hallucinationRisk.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.hallucinationRisk === 'low' && 'This response shows high reliability and accuracy.'}
              {metrics.hallucinationRisk === 'medium' && 'Some uncertainty detected. Consider verification.'}
              {metrics.hallucinationRisk === 'high' && 'Significant risk of inaccuracies. Please verify.'}
            </p>
          </div>
        </div>
      </div>

      {/* Fact Check Status */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Fact Verification</h4>
        <div className="flex items-center gap-2">
          <CheckCircle className={cn("h-4 w-4", getFactCheckColor(metrics.factCheckStatus))} />
          <span className={cn("text-sm font-medium", getFactCheckColor(metrics.factCheckStatus))}>
            {metrics.factCheckStatus === 'verified' && 'All facts verified against reliable sources'}
            {metrics.factCheckStatus === 'unverified' && 'Some facts require additional verification'}
            {metrics.factCheckStatus === 'disputed' && 'Conflicting information detected'}
          </span>
        </div>
      </div>

      {/* Educational Effectiveness */}
      {showEducationalEffectiveness && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Educational Effectiveness
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Learning Value</span>
              <div className="flex items-center gap-2">
                {(() => {
                  const effectiveness = getEducationalEffectivenessLevel(metrics.educationalEffectiveness);
                  const IconComponent = effectiveness.icon;
                  return (
                    <>
                      <IconComponent className={cn("h-4 w-4", effectiveness.color)} />
                      <span className={cn("text-sm font-medium", effectiveness.color)}>
                        {effectiveness.label}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
            <Progress value={metrics.educationalEffectiveness * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              This response provides {Math.round(metrics.educationalEffectiveness * 100)}% educational value
              based on clarity, accuracy, and learning appropriateness.
            </p>
          </div>
        </div>
      )}

      {/* User Satisfaction */}
      {metrics.userSatisfaction !== undefined && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">User Satisfaction</h4>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3 h-3 rounded-full",
                    i < Math.round(metrics.userSatisfaction!) 
                      ? "bg-yellow-400" 
                      : "bg-gray-200"
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium">
              {metrics.userSatisfaction.toFixed(1)}/5.0
            </span>
          </div>
        </div>
      )}

      {/* Quality Insights */}
      {showDetails && (
        <div className="pt-2 border-t space-y-2">
          <h4 className="text-sm font-medium">Quality Insights</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            {metrics.overall >= 0.9 && (
              <p>✅ Excellent quality response with high reliability</p>
            )}
            {metrics.overall >= 0.7 && metrics.overall < 0.9 && (
              <p>✅ Good quality response with minor areas for improvement</p>
            )}
            {metrics.overall < 0.7 && (
              <p>⚠️ Response quality could be improved with additional verification</p>
            )}
            {metrics.factual < 0.8 && (
              <p>🔍 Consider verifying specific facts and figures</p>
            )}
            {metrics.confidence < 0.7 && (
              <p>🤔 AI shows lower confidence - additional sources recommended</p>
            )}
            {metrics.educationalEffectiveness >= 0.8 && (
              <p>📚 Highly educational and appropriate for learning</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default QualityMetricsDisplay;