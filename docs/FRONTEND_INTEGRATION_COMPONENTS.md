# Frontend Integration Components for Hallucination Prevention
===========================================================

## Overview

This document outlines the frontend components and UI enhancements needed to integrate the 5-layer hallucination prevention system into the existing BlockWise chat interface. The goal is to provide users with transparency, control, and feedback mechanisms while maintaining a smooth user experience.

## Component Architecture

### Component Hierarchy
```
HallucinationPreventionProvider (Context)
├── QualityIndicators
│   ├── QualityScoreBadge
│   ├── ConfidenceMeter
│   └── HallucinationRiskIndicator
├── ValidationFeedback
│   ├── InputValidationStatus
│   ├── ResponseValidationResults
│   └── FactCheckDisplay
├── UserControls
│   ├── ValidationSettingsPanel
│   ├── FeedbackCollection
│   └── QualityPreferences
└── MonitoringDashboard
    ├── RealTimeMetrics
    ├── QualityTrends
    └── SystemAlerts
```

## Core Components

### 1. Hallucination Prevention Provider (Context)

```tsx
// contexts/HallucinationPreventionContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface HallucinationPreventionState {
  // Input validation state
  inputValidation: {
    isValidating: boolean;
    lastResult: ValidationResult | null;
    validationLevel: 'basic' | 'strict' | 'enhanced';
  };
  
  // Response validation state
  responseValidation: {
    isValidating: boolean;
    lastResult: ResponseValidationResult | null;
    qualityThreshold: number;
  };
  
  // Quality monitoring state
  qualityMetrics: {
    currentScore: number;
    hallucinationRisk: 'low' | 'medium' | 'high';
    factCheckStatus: 'verified' | 'unverified' | 'disputed';
    confidenceLevel: number;
  };
  
  // User preferences
  preferences: {
    enableValidation: boolean;
    showValidationDetails: boolean;
    collectFeedback: boolean;
    qualityThreshold: number;
    validationLevel: 'basic' | 'strict' | 'enhanced';
  };
  
  // Real-time monitoring
  monitoring: {
    isEnabled: boolean;
    activeAlerts: QualityAlert[];
    systemStatus: SystemStatus;
  };
}

interface HallucinationPreventionContextType {
  state: HallucinationPreventionState;
  actions: {
    validateInput: (input: string) => Promise<ValidationResult>;
    validateResponse: (response: string, query: string) => Promise<ResponseValidationResult>;
    collectFeedback: (feedback: UserFeedback) => Promise<void>;
    updatePreferences: (preferences: Partial<Preferences>) => void;
    getQualityMetrics: () => Promise<QualityMetrics>;
  };
}

const HallucinationPreventionContext = createContext<HallucinationPreventionContextType | null>(null);

export const HallucinationPreventionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  const actions = {
    validateInput: async (input: string) => {
      dispatch({ type: 'SET_INPUT_VALIDATING', payload: true });
      try {
        const result = await fetch('/api/hallucination-prevention/validate-input', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input,
            validationLevel: state.preferences.validationLevel
          })
        }).then(res => res.json());
        
        dispatch({ type: 'SET_INPUT_VALIDATION_RESULT', payload: result.data });
        return result.data;
      } finally {
        dispatch({ type: 'SET_INPUT_VALIDATING', payload: false });
      }
    },
    
    validateResponse: async (response: string, query: string) => {
      dispatch({ type: 'SET_RESPONSE_VALIDATING', payload: true });
      try {
        const result = await fetch('/api/hallucination-prevention/validate-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            response,
            originalQuery: query,
            validationLevel: state.preferences.validationLevel
          })
        }).then(res => res.json());
        
        dispatch({ type: 'SET_RESPONSE_VALIDATION_RESULT', payload: result.data });
        return result.data;
      } finally {
        dispatch({ type: 'SET_RESPONSE_VALIDATING', payload: false });
      }
    },
    
    collectFeedback: async (feedback: UserFeedback) => {
      await fetch('/api/hallucination-prevention/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });
    },
    
    updatePreferences: (preferences: Partial<Preferences>) => {
      dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
    },
    
    getQualityMetrics: async () => {
      const result = await fetch('/api/hallucination-prevention/quality/metrics')
        .then(res => res.json());
      return result.data;
    }
  };
  
  return (
    <HallucinationPreventionContext.Provider value={{ state, actions }}>
      {children}
    </HallucinationPreventionContext.Provider>
  );
};

export const useHallucinationPrevention = () => {
  const context = useContext(HallucinationPreventionContext);
  if (!context) {
    throw new Error('useHallucinationPrevention must be used within HallucinationPreventionProvider');
  }
  return context;
};
```

### 2. Quality Indicators Components

#### Quality Score Badge
```tsx
// components/hallucination-prevention/QualityScoreBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface QualityScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export const QualityScoreBadge: React.FC<QualityScoreBadgeProps> = ({
  score,
  size = 'md',
  showDetails = false,
  clickable = false,
  onClick
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="h-3 w-3" />;
    if (score >= 0.6) return <AlertTriangle className="h-3 w-3" />;
    return <XCircle className="h-3 w-3" />;
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'High Quality';
    if (score >= 0.6) return 'Medium Quality';
    return 'Needs Review';
  };
  
  return (
    <div
      className={`inline-flex items-center gap-2 ${clickable ? 'cursor-pointer' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <Badge
        variant="outline"
        className={`${getScoreColor(score)} text-white border-0`}
      >
        <div className="flex items-center gap-1">
          {getScoreIcon(score)}
          <span className="text-xs font-medium">
            {Math.round(score * 100)}%
          </span>
        </div>
      </Badge>
      {showDetails && (
        <span className="text-xs text-muted-foreground">
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
};
```

#### Confidence Meter
```tsx
// components/hallucination-prevention/ConfidenceMeter.tsx
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConfidenceMeterProps {
  confidence: number;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  confidence,
  label = 'Confidence',
  showLabel = true,
  size = 'md',
  interactive = false
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-blue-500';
    if (confidence >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    if (confidence >= 0.4) return 'Low';
    return 'Very Low';
  };
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  return (
    <Card className={`p-3 ${interactive ? 'cursor-pointer hover:bg-muted/50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        {showLabel && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI's confidence in the accuracy of this response</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        <span className="text-sm font-semibold">
          {Math.round(confidence * 100)}% ({getConfidenceLevel(confidence)})
        </span>
      </div>
      <Progress
        value={confidence * 100}
        className={`${sizeClasses[size]}`}
        style={{
          background: getConfidenceColor(confidence)
        }}
      />
    </Card>
  );
};
```

#### Hallucination Risk Indicator
```tsx
// components/hallucination-prevention/HallucinationRiskIndicator.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, ShieldAlert } from 'lucide-react';

interface HallucinationRiskIndicatorProps {
  riskLevel: 'low' | 'medium' | 'high';
  showAlert?: boolean;
  onShowDetails?: () => void;
}

export const HallucinationRiskIndicator: React.FC<HallucinationRiskIndicatorProps> = ({
  riskLevel,
  showAlert = false,
  onShowDetails
}) => {
  const getRiskConfig = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return {
          icon: <Shield className="h-3 w-3" />,
          label: 'Low Risk',
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50'
        };
      case 'medium':
        return {
          icon: <ShieldAlert className="h-3 w-3" />,
          label: 'Medium Risk',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50'
        };
      case 'high':
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          label: 'High Risk',
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50'
        };
    }
  };
  
  const config = getRiskConfig(riskLevel);
  
  return (
    <>
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={`${config.color} text-white border-0`}
        >
          <div className="flex items-center gap-1">
            {config.icon}
            <span className="text-xs font-medium">{config.label}</span>
          </div>
        </Badge>
        {onShowDetails && (
          <button
            onClick={onShowDetails}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            View Details
          </button>
        )}
      </div>
      
      {showAlert && riskLevel === 'high' && (
        <Alert className="mt-2 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            This response may contain inaccuracies. Please verify important information.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
```

### 3. Validation Feedback Components

#### Input Validation Status
```tsx
// components/hallucination-prevention/InputValidationStatus.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface InputValidationStatusProps {
  validation: ValidationResult;
  isValidating: boolean;
  className?: string;
}

export const InputValidationStatus: React.FC<InputValidationStatusProps> = ({
  validation,
  isValidating,
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  if (isValidating) {
    return (
      <Card className={`p-3 ${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Validating input...</span>
        </div>
      </Card>
    );
  }
  
  if (!validation) return null;
  
  const getValidationIcon = (passed: boolean) => {
    if (passed) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };
  
  return (
    <Card className={`p-3 ${className}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {getValidationIcon(validation.isValid)}
            <span className="text-sm font-medium">
              Input Validation: {validation.isValid ? 'Passed' : 'Issues Found'}
            </span>
          </div>
          <Badge variant={validation.isValid ? 'default' : 'destructive'}>
            {validation.overallScore ? `${Math.round(validation.overallScore * 100)}%` : 'N/A'}
          </Badge>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-3 space-y-2">
          {/* Sanitization Results */}
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">Content Safety</h4>
            <div className="flex items-center gap-2">
              {getValidationIcon(validation.sanitization.isClean)}
              <span className="text-xs">
                {validation.sanitization.isClean ? 'Safe content' : 'Content filtered'}
              </span>
            </div>
            {validation.sanitization.reasons.length > 0 && (
              <div className="text-xs text-muted-foreground ml-6">
                Filtered: {validation.sanitization.reasons.join(', ')}
              </div>
            )}
          </div>
          
          {/* Classification Results */}
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">Query Classification</h4>
            <div className="text-xs">
              Type: {validation.classification.type} | 
              Confidence: {Math.round(validation.classification.confidence * 100)}%
            </div>
          </div>
          
          {/* Safety Check Results */}
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground">Safety Assessment</h4>
            <div className="flex items-center gap-2">
              {getValidationIcon(validation.safety.isSafe)}
              <span className="text-xs">
                {validation.safety.isSafe ? 'Safe to process' : 'Potentially unsafe'}
              </span>
            </div>
            {validation.safety.riskLevel !== 'low' && (
              <Badge variant="outline" className="text-xs">
                Risk: {validation.safety.riskLevel}
              </Badge>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
```

#### Response Validation Results
```tsx
// components/hallucination-prevention/ResponseValidationResults.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ResponseValidationResultsProps {
  validation: ResponseValidationResult;
  showSources?: boolean;
  className?: string;
}

export const ResponseValidationResults: React.FC<ResponseValidationResultsProps> = ({
  validation,
  showSources = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (score >= 0.6) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };
  
  return (
    <Card className={`p-4 ${className}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {getScoreIcon(validation.overallScore)}
            <div>
              <h3 className="text-sm font-medium">Response Quality Analysis</h3>
              <p className="text-xs text-muted-foreground">
                Overall Score: <span className={getScoreColor(validation.overallScore)}>
                  {Math.round(validation.overallScore * 100)}%
                </span>
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {isOpen ? 'Hide' : 'Show'} Details
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4 space-y-4">
          {/* Quality Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Factual Accuracy</h4>
              <div className="flex items-center gap-2">
                {getScoreIcon(validation.checks.factual.score)}
                <span className={`text-sm ${getScoreColor(validation.checks.factual.score)}`}>
                  {Math.round(validation.checks.factual.score * 100)}%
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Logical Consistency</h4>
              <div className="flex items-center gap-2">
                {getScoreIcon(validation.checks.logical.score)}
                <span className={`text-sm ${getScoreColor(validation.checks.logical.score)}`}>
                  {Math.round(validation.checks.logical.score * 100)}%
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Completeness</h4>
              <div className="flex items-center gap-2">
                {getScoreIcon(validation.checks.complete.score)}
                <span className={`text-sm ${getScoreColor(validation.checks.complete.score)}`}>
                  {Math.round(validation.checks.complete.score * 100)}%
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Response Relevance</h4>
              <div className="flex items-center gap-2">
                {getScoreIcon(validation.checks.consistent.score)}
                <span className={`text-sm ${getScoreColor(validation.checks.consistent.score)}`}>
                  {Math.round(validation.checks.consistent.score * 100)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Issues Found */}
          {validation.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Issues Detected</h4>
              <div className="space-y-1">
                {validation.issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">{issue.type}:</span> {issue.description}
                      {issue.severity && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {issue.severity}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Fact Checking Results */}
          {validation.factCheck && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Fact Verification</h4>
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span>Facts Verified:</span>
                  <span className="font-medium text-green-600">
                    {validation.factCheck.verified}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Unverified Claims:</span>
                  <span className="font-medium text-yellow-600">
                    {validation.factCheck.unverified}
                  </span>
                </div>
                {validation.factCheck.contradicted > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Contradictory Claims:</span>
                    <span className="font-medium text-red-600">
                      {validation.factCheck.contradicted}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Sources */}
          {showSources && validation.sources && validation.sources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Sources Referenced</h4>
              <div className="space-y-1">
                {validation.sources.map((source, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="flex-1">{source.title}</span>
                    {source.url && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View source</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recommendations */}
          {validation.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Recommendations</h4>
              <div className="space-y-1">
                {validation.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
```

### 4. User Control Components

#### Validation Settings Panel
```tsx
// components/hallucination-prevention/ValidationSettingsPanel.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Settings, Shield, CheckCircle } from 'lucide-react';
import { useHallucinationPrevention } from '@/contexts/HallucinationPreventionContext';

interface ValidationSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ValidationSettingsPanel: React.FC<ValidationSettingsPanelProps> = ({
  isOpen,
  onClose
}) => {
  const { state, actions } = useHallucinationPrevention();
  const { preferences, qualityMetrics } = state;
  
  const handlePreferenceChange = (key: keyof Preferences, value: any) => {
    actions.updatePreferences({ [key]: value });
  };
  
  if (!isOpen) return null;
  
  return (
    <Card className="absolute right-4 top-4 w-80 z-50 shadow-lg">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h3 className="font-medium">Quality Settings</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
        
        {/* Enable Validation Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="enable-validation" className="text-sm font-medium">
              Enable Validation
            </Label>
            <p className="text-xs text-muted-foreground">
              Run quality checks on inputs and responses
            </p>
          </div>
          <Switch
            id="enable-validation"
            checked={preferences.enableValidation}
            onCheckedChange={(checked) => handlePreferenceChange('enableValidation', checked)}
          />
        </div>
        
        {/* Validation Level */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Validation Level</Label>
          <Select
            value={preferences.validationLevel}
            onValueChange={(value) => handlePreferenceChange('validationLevel', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic - Fast validation</SelectItem>
              <SelectItem value="strict">Strict - Thorough checking</SelectItem>
              <SelectItem value="enhanced">Enhanced - Comprehensive analysis</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Quality Threshold */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quality Threshold</Label>
          <p className="text-xs text-muted-foreground">
            Minimum quality score: {Math.round(preferences.qualityThreshold * 100)}%
          </p>
          <Slider
            value={[preferences.qualityThreshold]}
            onValueChange={([value]) => handlePreferenceChange('qualityThreshold', value)}
            max={1}
            min={0.1}
            step={0.1}
            className="w-full"
          />
        </div>
        
        {/* Show Validation Details */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="show-details" className="text-sm font-medium">
              Show Validation Details
            </Label>
            <p className="text-xs text-muted-foreground">
              Display detailed validation results
            </p>
          </div>
          <Switch
            id="show-details"
            checked={preferences.showValidationDetails}
            onCheckedChange={(checked) => handlePreferenceChange('showValidationDetails', checked)}
          />
        </div>
        
        {/* Collect Feedback */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="collect-feedback" className="text-sm font-medium">
              Collect Feedback
            </Label>
            <p className="text-xs text-muted-foreground">
              Help improve response quality
            </p>
          </div>
          <Switch
            id="collect-feedback"
            checked={preferences.collectFeedback}
            onCheckedChange={(checked) => handlePreferenceChange('collectFeedback', checked)}
          />
        </div>
        
        {/* Current Quality Status */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Current Quality</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Overall Score:</span>
              <span className="font-medium">
                {Math.round(qualityMetrics.currentScore * 100)}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Confidence:</span>
              <span className="font-medium">
                {Math.round(qualityMetrics.confidenceLevel * 100)}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Risk Level:</span>
              <span className={`font-medium ${
                qualityMetrics.hallucinationRisk === 'low' ? 'text-green-600' :
                qualityMetrics.hallucinationRisk === 'medium' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {qualityMetrics.hallucinationRisk}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
```

#### Feedback Collection Component
```tsx
// components/hallucination-prevention/FeedbackCollection.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ThumbsUp, ThumbsDown, Flag, MessageSquare, Star } from 'lucide-react';
import { useHallucinationPrevention } from '@/contexts/HallucinationPreventionContext';

interface FeedbackCollectionProps {
  responseId: string;
  response: string;
  onSubmit: (feedback: UserFeedback) => void;
  onClose: () => void;
}

export const FeedbackCollection: React.FC<FeedbackCollectionProps> = ({
  responseId,
  response,
  onSubmit,
  onClose
}) => {
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | 'correction' | 'flag'>('positive');
  const [rating, setRating] = useState<number>(0);
  const [corrections, setCorrections] = useState<string>('');
  const [flagReasons, setFlagReasons] = useState<string[]>([]);
  const [additionalComments, setAdditionalComments] = useState<string>('');
  
  const { actions } = useHallucinationPrevention();
  
  const handleSubmit = async () => {
    const feedback: UserFeedback = {
      id: crypto.randomUUID(),
      responseId,
      type: feedbackType,
      rating: feedbackType === 'positive' || feedbackType === 'negative' ? rating : undefined,
      corrections: feedbackType === 'correction' ? [{ original: response, corrected: corrections }] : undefined,
      flagReasons: feedbackType === 'flag' ? flagReasons : undefined,
      feedbackText: additionalComments,
      timestamp: new Date()
    };
    
    await actions.collectFeedback(feedback);
    onSubmit(feedback);
    onClose();
  };
  
  const toggleFlagReason = (reason: string) => {
    setFlagReasons(prev => 
      prev.includes(reason) 
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };
  
  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-medium">Help us improve this response</h3>
      
      {/* Feedback Type Selection */}
      <div className="space-y-2">
        <Label>How was this response?</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={feedbackType === 'positive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedbackType('positive')}
            className="justify-start"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Helpful
          </Button>
          <Button
            variant={feedbackType === 'negative' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedbackType('negative')}
            className="justify-start"
          >
            <ThumbsDown className="h-4 w-4 mr-2" />
            Not helpful
          </Button>
          <Button
            variant={feedbackType === 'correction' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedbackType('correction')}
            className="justify-start"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Needs correction
          </Button>
          <Button
            variant={feedbackType === 'flag' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedbackType('flag')}
            className="justify-start"
          >
            <Flag className="h-4 w-4 mr-2" />
            Report issue
          </Button>
        </div>
      </div>
      
      {/* Rating Stars (for positive/negative feedback) */}
      {(feedbackType === 'positive' || feedbackType === 'negative') && (
        <div className="space-y-2">
          <Label>Rate this response</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                variant="ghost"
                size="sm"
                className="p-1"
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-4 w-4 ${
                    star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Correction Text (for correction feedback) */}
      {feedbackType === 'correction' && (
        <div className="space-y-2">
          <Label htmlFor="corrections">What should be corrected?</Label>
          <Textarea
            id="corrections"
            placeholder="Please provide the correct information..."
            value={corrections}
            onChange={(e) => setCorrections(e.target.value)}
            rows={3}
          />
        </div>
      )}
      
      {/* Flag Reasons (for flag feedback) */}
      {feedbackType === 'flag' && (
        <div className="space-y-2">
          <Label>What's wrong with this response?</Label>
          <div className="space-y-1">
            {[
              'Factually incorrect',
              'Inappropriate content',
              'Harmful or dangerous',
              'Spam or irrelevant',
              'Violates policies',
              'Other'
            ].map((reason) => (
              <label key={reason} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={flagReasons.includes(reason)}
                  onChange={() => toggleFlagReason(reason)}
                  className="rounded"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* Additional Comments */}
      <div className="space-y-2">
        <Label htmlFor="comments">Additional comments (optional)</Label>
        <Textarea
          id="comments"
          placeholder="Any other feedback you'd like to share..."
          value={additionalComments}
          onChange={(e) => setAdditionalComments(e.target.value)}
          rows={2}
        />
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={
          feedbackType === 'positive' || feedbackType === 'negative' ? rating === 0 :
          feedbackType === 'correction' ? corrections.trim() === '' :
          feedbackType === 'flag' ? flagReasons.length === 0 : false
        }>
          Submit Feedback
        </Button>
      </div>
    </Card>
  );
};
```

### 5. Enhanced Chat Components

#### Enhanced Message Bubble
```tsx
// components/chat/EnhancedMessageBubble.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QualityScoreBadge } from '@/components/hallucination-prevention/QualityScoreBadge';
import { ConfidenceMeter } from '@/components/hallucination-prevention/ConfidenceMeter';
import { HallucinationRiskIndicator } from '@/components/hallucination-prevention/HallucinationRiskIndicator';
import { ResponseValidationResults } from '@/components/hallucination-prevention/ResponseValidationResults';
import { FeedbackCollection } from '@/components/hallucination-prevention/FeedbackCollection';
import { MessageSquare, ThumbsUp, AlertCircle, Settings } from 'lucide-react';
import { useHallucinationPrevention } from '@/contexts/HallucinationPreventionContext';

interface EnhancedMessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  showHeader?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  onRegenerate?: () => void;
}

export const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({
  message,
  isStreaming = false,
  showHeader = true,
  isFirstInGroup = false,
  isLastInGroup = false,
  onRegenerate
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const { state } = useHallucinationPrevention();
  const { preferences } = state;
  
  const isAssistant = message.role === 'assistant';
  const hasQualityData = message.qualityScore !== undefined;
  const shouldShowValidation = isAssistant && hasQualityData && preferences.showValidationDetails;
  
  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-[80%] ${isAssistant ? 'mr-auto' : 'ml-auto'}`}>
        {/* Quality Indicators for Assistant Messages */}
        {isAssistant && hasQualityData && (
          <div className="mb-2 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <QualityScoreBadge 
                score={message.qualityScore || 0} 
                size="sm"
                clickable={shouldShowValidation}
                onClick={() => setShowValidation(!showValidation)}
              />
              {message.confidenceScore !== undefined && (
                <ConfidenceMeter 
                  confidence={message.confidenceScore} 
                  size="sm"
                />
              )}
              {message.hallucinationRisk && (
                <HallucinationRiskIndicator 
                  riskLevel={message.hallucinationRisk}
                  showAlert={message.hallucinationRisk === 'high'}
                />
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFeedback(true)}
                className="h-6 px-2 text-xs"
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Feedback
              </Button>
              
              {shouldShowValidation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowValidation(!showValidation)}
                  className="h-6 px-2 text-xs"
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {showValidation ? 'Hide' : 'Show'} Analysis
                </Button>
              )}
              
              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  className="h-6 px-2 text-xs"
                >
                  Regenerate
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Main Message */}
        <Card className={`p-4 ${
          isAssistant 
            ? 'bg-muted' 
            : 'bg-primary text-primary-foreground ml-8'
        }`}>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {message.content}
          </div>
          
          {/* Streaming Indicator */}
          {isStreaming && (
            <div className="mt-2 flex items-center gap-1 text-xs opacity-70">
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              <span className="ml-2">AI is thinking...</span>
            </div>
          )}
        </Card>
        
        {/* Validation Results */}
        {shouldShowValidation && showValidation && message.validationResults && (
          <div className="mt-2">
            <ResponseValidationResults 
              validation={message.validationResults}
              showSources={true}
            />
          </div>
        )}
        
        {/* Feedback Collection */}
        {showFeedback && (
          <div className="mt-2">
            <FeedbackCollection
              responseId={message.id}
              response={message.content}
              onSubmit={(feedback) => {
                console.log('Feedback submitted:', feedback);
                setShowFeedback(false);
              }}
              onClose={() => setShowFeedback(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
```

## Integration with Existing Components

### Enhanced Chat Interface
```tsx
// components/chat/EnhancedChatInterface.tsx
import React, { useState } from 'react';
import { ChatInterface } from './ChatInterface';
import { HallucinationPreventionProvider } from '@/contexts/HallucinationPreventionContext';
import { ValidationSettingsPanel } from '@/components/hallucination-prevention/ValidationSettingsPanel';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface EnhancedChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, attachments?: File[]) => void;
  isLoading: boolean;
  preferences: ChatPreferences;
  onUpdatePreferences: (preferences: Partial<ChatPreferences>) => void;
  studyContext: StudyContext;
}

export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = (props) => {
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <HallucinationPreventionProvider>
      <div className="relative h-full">
        {/* Settings Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(true)}
          className="absolute top-4 right-4 z-10"
        >
          <Settings className="h-4 w-4" />
        </Button>
        
        {/* Settings Panel */}
        <ValidationSettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
        
        {/* Enhanced Chat Interface */}
        <ChatInterface
          {...props}
          // Add enhanced message rendering
          renderMessage={(message) => (
            <EnhancedMessageBubble
              key={message.id}
              message={message}
              isStreaming={message.streaming}
              onRegenerate={() => {
                // Handle regeneration with quality checks
                const lastUserMessage = props.messages
                  .slice()
                  .reverse()
                  .find(m => m.role === 'user');
                if (lastUserMessage) {
                  props.onSendMessage(lastUserMessage.content);
                }
              }}
            />
          )}
        />
      </div>
    </HallucinationPreventionProvider>
  );
};
```

## Real-time Monitoring Dashboard

### Quality Monitoring Widget
```tsx
// components/hallucination-prevention/QualityMonitoringWidget.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useHallucinationPrevention } from '@/contexts/HallucinationPreventionContext';

export const QualityMonitoringWidget: React.FC = () => {
  const { actions } = useHallucinationPrevention();
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const data = await actions.getQualityMetrics();
        setMetrics(data);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  if (isLoading || !metrics) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4" />
        <h3 className="font-medium">Quality Monitoring</h3>
        <Badge variant="outline" className="ml-auto">
          Live
        </Badge>
      </div>
      
      {/* Current Quality Metrics */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Hallucination Rate</span>
            <span className="text-green-600">
              {Math.round(metrics.currentPeriod.hallucinationRate * 100)}%
            </span>
          </div>
          <Progress value={100 - (metrics.currentPeriod.hallucinationRate * 100)} className="h-2" />
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Fact Accuracy</span>
            <span className="text-blue-600">
              {Math.round(metrics.currentPeriod.factAccuracy * 100)}%
            </span>
          </div>
          <Progress value={metrics.currentPeriod.factAccuracy * 100} className="h-2" />
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>User Satisfaction</span>
            <span className="text-purple-600">
              {metrics.currentPeriod.userSatisfaction.toFixed(1)}/5.0
            </span>
          </div>
          <Progress value={(metrics.currentPeriod.userSatisfaction / 5) * 100} className="h-2" />
        </div>
      </div>
      
      {/* Active Alerts */}
      {metrics.alerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Active Alerts</h4>
          <div className="space-y-1">
            {metrics.alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                <span className="flex-1">{alert.message}</span>
                <Badge variant="outline" className="text-xs">
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Trends */}
      {metrics.trends.daily && metrics.trends.daily.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">24h Trend</h4>
          <div className="flex items-center gap-1">
            {metrics.trends.daily[metrics.trends.daily.length - 1].value > 
             metrics.trends.daily[0].value ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className="text-xs">
              {metrics.trends.daily[metrics.trends.daily.length - 1].value > 
               metrics.trends.daily[0].value ? 'Improving' : 'Declining'}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
```

## Summary

The frontend integration components provide:

1. **Context Management** - Centralized state management for all hallucination prevention features
2. **Visual Quality Indicators** - Clear, user-friendly displays of response quality metrics
3. **Interactive Validation** - Detailed validation results with expandable sections
4. **User Controls** - Granular settings for validation preferences and thresholds
5. **Feedback Collection** - Seamless feedback mechanisms for continuous improvement
6. **Real-time Monitoring** - Live quality dashboards and system status
7. **Enhanced UX** - Non-intrusive integration that doesn't disrupt existing workflows

These components create a comprehensive frontend layer that makes the 5-layer hallucination prevention system transparent and controllable for end users while maintaining the existing user experience.