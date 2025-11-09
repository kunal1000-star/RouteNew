"use client";

import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Types for the 5-layer system
export interface LayerStatus {
  layer: 1 | 2 | 3 | 4 | 5;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  confidence?: number;
  processingTime?: number;
  details?: string;
  results?: any;
}

export interface QualityMetrics {
  overall: number;
  factual: number;
  logical: number;
  complete: number;
  consistent: number;
  confidence: number;
  hallucinationRisk: 'low' | 'medium' | 'high';
  factCheckStatus: 'verified' | 'unverified' | 'disputed';
  educationalEffectiveness: number;
  userSatisfaction?: number;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  latency: number;
  uptime: number;
  activeAlerts: Alert[];
  providerHealth: Record<string, boolean>;
  processingQueue: number;
}

export interface Alert {
  id: string;
  type: 'quality' | 'performance' | 'system' | 'user';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface UserFeedback {
  id: string;
  responseId: string;
  type: 'positive' | 'negative' | 'correction' | 'flag' | 'clarification';
  rating?: number;
  corrections?: string;
  flagReasons?: string[];
  feedbackText?: string;
  timestamp: Date;
}

export interface HallucinationPreventionState {
  // Layer processing status
  layerStatuses: LayerStatus[];
  isProcessing: boolean;
  currentLayer?: number;
  
  // Quality metrics
  qualityMetrics: QualityMetrics | null;
  lastValidatedResponse: string | null;
  
  // User preferences
  preferences: {
    showValidationDetails: boolean;
    showLayerStatus: boolean;
    showQualityScores: boolean;
    collectFeedback: boolean;
    validationLevel: 'basic' | 'strict' | 'enhanced';
    qualityThreshold: number;
  };
  
  // System health
  systemHealth: SystemHealth | null;
  
  // User feedback
  feedbackCollection: {
    isCollecting: boolean;
    currentResponseId: string | null;
    pendingFeedback: UserFeedback[];
  };
  
  // Learning insights
  learningInsights: {
    totalInteractions: number;
    accuracyTrend: number;
    improvementAreas: string[];
    personalizedRecommendations: string[];
    lastUpdated: Date | null;
  };
}

type HallucinationPreventionAction =
  | { type: 'START_LAYER_PROCESSING'; layer: number }
  | { type: 'UPDATE_LAYER_STATUS'; layer: number; status: Partial<LayerStatus> }
  | { type: 'COMPLETE_LAYER_PROCESSING'; layer: number; results: any }
  | { type: 'FAIL_LAYER_PROCESSING'; layer: number; error: string }
  | { type: 'SET_QUALITY_METRICS'; metrics: QualityMetrics }
  | { type: 'SET_SYSTEM_HEALTH'; health: SystemHealth }
  | { type: 'START_FEEDBACK_COLLECTION'; responseId: string }
  | { type: 'SUBMIT_FEEDBACK'; feedback: UserFeedback }
  | { type: 'UPDATE_PREFERENCES'; preferences: Partial<HallucinationPreventionState['preferences']> }
  | { type: 'SET_LEARNING_INSIGHTS'; insights: Partial<HallucinationPreventionState['learningInsights']> }
  | { type: 'RESET_PROCESSING' };

const initialState: HallucinationPreventionState = {
  layerStatuses: [
    { layer: 1, name: 'Input Validation', status: 'pending' },
    { layer: 2, name: 'Context Management', status: 'pending' },
    { layer: 3, name: 'Response Validation', status: 'pending' },
    { layer: 4, name: 'User Feedback', status: 'pending' },
    { layer: 5, name: 'Quality Monitoring', status: 'pending' },
  ],
  isProcessing: false,
  qualityMetrics: null,
  lastValidatedResponse: null,
  preferences: {
    showValidationDetails: true,
    showLayerStatus: true,
    showQualityScores: true,
    collectFeedback: true,
    validationLevel: 'strict',
    qualityThreshold: 0.8,
  },
  systemHealth: null,
  feedbackCollection: {
    isCollecting: false,
    currentResponseId: null,
    pendingFeedback: [],
  },
  learningInsights: {
    totalInteractions: 0,
    accuracyTrend: 0,
    improvementAreas: [],
    personalizedRecommendations: [],
    lastUpdated: null,
  },
};

function hallucinationPreventionReducer(state: HallucinationPreventionState, action: HallucinationPreventionAction): HallucinationPreventionState {
  switch (action.type) {
    case 'START_LAYER_PROCESSING':
      return {
        ...state,
        isProcessing: true,
        currentLayer: action.layer,
        layerStatuses: state.layerStatuses.map(ls => 
          ls.layer === action.layer 
            ? { ...ls, status: 'processing' as const, processingTime: Date.now() }
            : ls
        ),
      };
    
    case 'UPDATE_LAYER_STATUS':
      return {
        ...state,
        layerStatuses: state.layerStatuses.map(ls => 
          ls.layer === action.layer 
            ? { ...ls, ...action.status }
            : ls
        ),
      };
    
    case 'COMPLETE_LAYER_PROCESSING':
      return {
        ...state,
        isProcessing: false,
        currentLayer: undefined,
        layerStatuses: state.layerStatuses.map(ls => 
          ls.layer === action.layer 
            ? { 
                ...ls, 
                status: 'completed' as const, 
                results: action.results,
                processingTime: Date.now() - (ls.processingTime || Date.now())
              }
            : ls
        ),
      };
    
    case 'FAIL_LAYER_PROCESSING':
      return {
        ...state,
        isProcessing: false,
        currentLayer: undefined,
        layerStatuses: state.layerStatuses.map(ls => 
          ls.layer === action.layer 
            ? { ...ls, status: 'failed' as const, details: action.error }
            : ls
        ),
      };
    
    case 'SET_QUALITY_METRICS':
      return {
        ...state,
        qualityMetrics: action.metrics,
        lastValidatedResponse: action.metrics ? new Date().toISOString() : null,
      };
    
    case 'SET_SYSTEM_HEALTH':
      return {
        ...state,
        systemHealth: action.health,
      };
    
    case 'START_FEEDBACK_COLLECTION':
      return {
        ...state,
        feedbackCollection: {
          ...state.feedbackCollection,
          isCollecting: true,
          currentResponseId: action.responseId,
        },
      };
    
    case 'SUBMIT_FEEDBACK':
      return {
        ...state,
        feedbackCollection: {
          ...state.feedbackCollection,
          isCollecting: false,
          currentResponseId: null,
          pendingFeedback: [...state.feedbackCollection.pendingFeedback, action.feedback],
        },
      };
    
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.preferences,
        },
      };
    
    case 'SET_LEARNING_INSIGHTS':
      return {
        ...state,
        learningInsights: {
          ...state.learningInsights,
          ...action.insights,
          lastUpdated: new Date(),
        },
      };
    
    case 'RESET_PROCESSING':
      return {
        ...state,
        isProcessing: false,
        currentLayer: undefined,
        layerStatuses: state.layerStatuses.map(ls => ({
          ...ls,
          status: 'pending' as const,
          processingTime: undefined,
          details: undefined,
          results: undefined,
        })),
      };
    
    default:
      return state;
  }
}

interface HallucinationPreventionContextType {
  state: HallucinationPreventionState;
  actions: {
    startLayerProcessing: (layer: number) => void;
    updateLayerStatus: (layer: number, status: Partial<LayerStatus>) => void;
    completeLayerProcessing: (layer: number, results: any) => void;
    failLayerProcessing: (layer: number, error: string) => void;
    setQualityMetrics: (metrics: QualityMetrics) => void;
    setSystemHealth: (health: SystemHealth) => void;
    startFeedbackCollection: (responseId: string) => void;
    submitFeedback: (feedback: UserFeedback) => Promise<void>;
    updatePreferences: (preferences: Partial<HallucinationPreventionState['preferences']>) => void;
    setLearningInsights: (insights: Partial<HallucinationPreventionState['learningInsights']>) => void;
    resetProcessing: () => void;
    validateInput: (input: string) => Promise<boolean>;
    validateResponse: (response: string, query: string) => Promise<QualityMetrics>;
    getSystemHealth: () => Promise<SystemHealth>;
    getLearningInsights: () => Promise<any>;
  };
}

const HallucinationPreventionContext = createContext<HallucinationPreventionContextType | null>(null);

export const HallucinationPreventionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(hallucinationPreventionReducer, initialState);
  const { toast } = useToast();

  // API endpoints for backend communication
  const API_BASE = '/api/hallucination-prevention';

  const actions = {
    startLayerProcessing: useCallback((layer: number) => {
      dispatch({ type: 'START_LAYER_PROCESSING', layer });
    }, []),

    updateLayerStatus: useCallback((layer: number, status: Partial<LayerStatus>) => {
      dispatch({ type: 'UPDATE_LAYER_STATUS', layer, status });
    }, []),

    completeLayerProcessing: useCallback((layer: number, results: any) => {
      dispatch({ type: 'COMPLETE_LAYER_PROCESSING', layer, results });
    }, []),

    failLayerProcessing: useCallback((layer: number, error: string) => {
      dispatch({ type: 'FAIL_LAYER_PROCESSING', layer, error });
      toast({
        title: `Layer ${layer} Failed`,
        description: error,
        variant: 'destructive',
      });
    }, [toast]),

    setQualityMetrics: useCallback((metrics: QualityMetrics) => {
      dispatch({ type: 'SET_QUALITY_METRICS', metrics });
    }, []),

    setSystemHealth: useCallback((health: SystemHealth) => {
      dispatch({ type: 'SET_SYSTEM_HEALTH', health });
    }, []),

    startFeedbackCollection: useCallback((responseId: string) => {
      dispatch({ type: 'START_FEEDBACK_COLLECTION', responseId });
    }, []),

    submitFeedback: useCallback(async (feedback: UserFeedback) => {
      try {
        await fetch(`${API_BASE}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedback),
        });
        dispatch({ type: 'SUBMIT_FEEDBACK', feedback });
        toast({
          title: 'Feedback Submitted',
          description: 'Thank you for helping us improve!',
        });
      } catch (error) {
        toast({
          title: 'Feedback Failed',
          description: 'Failed to submit feedback. Please try again.',
          variant: 'destructive',
        });
      }
    }, [toast]),

    updatePreferences: useCallback((preferences: Partial<HallucinationPreventionState['preferences']>) => {
      dispatch({ type: 'UPDATE_PREFERENCES', preferences });
    }, []),

    setLearningInsights: useCallback((insights: Partial<HallucinationPreventionState['learningInsights']>) => {
      dispatch({ type: 'SET_LEARNING_INSIGHTS', insights });
    }, []),

    resetProcessing: useCallback(() => {
      dispatch({ type: 'RESET_PROCESSING' });
    }, []),

    validateInput: useCallback(async (input: string): Promise<boolean> => {
      try {
        actions.startLayerProcessing(1);
        const response = await fetch(`${API_BASE}/validate-input`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input, level: state.preferences.validationLevel }),
        });
        const result = await response.json();
        
        actions.completeLayerProcessing(1, result);
        return result.isValid;
      } catch (error) {
        actions.failLayerProcessing(1, error instanceof Error ? error.message : 'Unknown error');
        return false;
      }
    }, [state.preferences.validationLevel]),

    validateResponse: useCallback(async (response: string, query: string): Promise<QualityMetrics> => {
      try {
        actions.startLayerProcessing(3);
        const res = await fetch(`${API_BASE}/validate-response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            response, 
            query, 
            level: state.preferences.validationLevel 
          }),
        });
        const result = await res.json();
        
        actions.completeLayerProcessing(3, result);
        actions.setQualityMetrics(result);
        return result;
      } catch (error) {
        actions.failLayerProcessing(3, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    }, [state.preferences.validationLevel]),

    getSystemHealth: useCallback(async (): Promise<SystemHealth> => {
      try {
        const response = await fetch(`${API_BASE}/health`);
        const result = await response.json();
        actions.setSystemHealth(result);
        return result;
      } catch (error) {
        console.error('Failed to get system health:', error);
        throw error;
      }
    }, []),

    getLearningInsights: useCallback(async () => {
      try {
        const response = await fetch(`${API_BASE}/insights`);
        const result = await response.json();
        actions.setLearningInsights(result);
        return result;
      } catch (error) {
        console.error('Failed to get learning insights:', error);
        throw error;
      }
    }, []),
  };

  // Auto-refresh system health every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.preferences.showQualityScores) {
        actions.getSystemHealth().catch(console.error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [state.preferences.showQualityScores, actions]);

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

export default HallucinationPreventionContext;