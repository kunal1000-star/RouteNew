# API Endpoint Modifications for Hallucination Prevention
======================================================

## Overview

This document outlines the modifications required to integrate the 5-layer hallucination prevention system into the existing chat API endpoints. The goal is to add comprehensive validation, monitoring, and quality assurance while maintaining backward compatibility.

## Current API Structure Analysis

### Existing Endpoints
```
GET    /api/chat                    - Get chat service health
POST   /api/chat                    - Send chat message
POST   /api/chat/study-assistant/send      - Study assistant send
POST   /api/chat/study-assistant/stream    - Study assistant streaming
GET    /api/admin/model-overrides          - Model override management
```

## Layer Integration Strategy

### Modified Flow Diagram
```
User Request → Layer 1 (Input Validation) → Layer 2 (Context Enhancement) 
    ↓
AI Service Manager → Layer 3 (Response Validation) → Layer 4 (Feedback Collection) 
    ↓
Layer 5 (Quality Monitoring) → Response to User
```

## API Endpoint Modifications

### 1. Enhanced Chat API (`/api/chat`)

#### GET `/api/chat` - Service Health with Hallucination Prevention
```typescript
// Enhanced health check response
interface ChatServiceHealthResponse {
  success: boolean;
  data: {
    service: {
      healthy: boolean;
      version: string;
      offlineMode: boolean;
    };
    providers: ProviderInfo[];
    capabilities: {
      streaming: boolean;
      fallback: boolean;
      sessionManagement: boolean;
      studyContext: boolean;
      // New hallucination prevention capabilities
      inputValidation: boolean;
      responseValidation: boolean;
      factChecking: boolean;
      qualityMonitoring: boolean;
      userFeedback: boolean;
    };
    // New quality metrics
    qualityMetrics: {
      hallucinationRate: number;
      averageQualityScore: number;
      userSatisfaction: number;
      factAccuracyRate: number;
    };
    // New system status
    systemStatus: {
      inputValidator: 'healthy' | 'degraded' | 'offline';
      contextBuilder: 'healthy' | 'degraded' | 'offline';
      responseValidator: 'healthy' | 'degraded' | 'offline';
      feedbackSystem: 'healthy' | 'degraded' | 'offline';
      monitoringSystem: 'healthy' | 'degraded' | 'offline';
    };
  };
  metadata: {
    timestamp: string;
    serviceInitialized: boolean;
    qualityChecksEnabled: boolean;
  };
}
```

#### POST `/api/chat` - Enhanced Chat with Hallucination Prevention
```typescript
// Enhanced request with validation options
interface EnhancedChatRequest {
  message: string;
  provider?: AIProvider;
  context?: any;
  preferences?: ChatPreferences & {
    // New hallucination prevention preferences
    enableValidation: boolean;
    validationLevel: 'basic' | 'strict' | 'enhanced';
    factCheckRequired: boolean;
    qualityThreshold: number; // 0-1
    feedbackEnabled: boolean;
    monitoringLevel: 'minimal' | 'standard' | 'comprehensive';
  };
  sessionId?: string;
  // New options for enhanced processing
  requireContextEnhancement: boolean;
  enableResponseValidation: boolean;
  collectFeedback: boolean;
}

// Enhanced response with quality metrics
interface EnhancedChatResponse {
  success: boolean;
  data?: {
    response: {
      content: string;
      sessionId: string;
      // Existing metadata
      provider: string;
      model: string;
      tokensUsed: number;
      latencyMs: number;
      // New quality metadata
      qualityScore?: number;
      confidenceScore?: number;
      factCheckStatus?: 'verified' | 'unverified' | 'disputed';
      validationResults?: ValidationResult;
      hallucinationRisk?: 'low' | 'medium' | 'high';
      sources?: Source[];
      responseId: string; // For feedback collection
    };
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  metadata: {
    timestamp: string;
    requestId: string;
    processingTime: number;
    // New processing metadata
    validationTime: number;
    contextEnhancementTime: number;
    responseValidationTime: number;
    totalQualityChecks: number;
  };
}
```

### 2. Enhanced Study Assistant API

#### POST `/api/chat/study-assistant/send` - Enhanced with 5-Layer Processing
```typescript
// New enhanced request structure
interface EnhancedStudyAssistantRequest {
  conversationId?: string;
  message: string;
  chatType: 'study_assistant';
  isPersonalQuery?: boolean;
  provider?: AIProvider;
  // New hallucination prevention options
  enableHallucinationPrevention: boolean;
  contextLevel: 1 | 2 | 3 | 4; // Student context compression level
  requireFactVerification: boolean;
  qualityThreshold: number;
  personalizedFeedback: boolean;
  // Enhanced options
  enableMemoryEnhancement: boolean;
  requireSourceAttribution: boolean;
  responseFormat: 'detailed' | 'concise' | 'structured';
}

// Enhanced response with comprehensive validation
interface EnhancedStudyAssistantResponse {
  success: boolean;
  data: {
    response: {
      content: string;
      model_used: string;
      provider_used: string;
      tokens_used: {
        input: number;
        output: number;
      };
      latency_ms: number;
      query_type: string;
      web_search_enabled: boolean;
      fallback_used: boolean;
      cached: boolean;
      isTimeSensitive: boolean;
      language: 'hinglish' | 'english';
      // New comprehensive validation data
      qualityMetrics: {
        overallScore: number;
        factAccuracy: number;
        responseRelevance: number;
        hallucinationRisk: number;
        confidenceLevel: number;
      };
      validationResults: {
        inputValidation: ValidationResult;
        contextEnhancement: EnhancementResult;
        responseValidation: ValidationResult;
        factChecking: FactCheckResult;
      };
      learningInsights?: {
        studentPattern: string;
        recommendedActions: string[];
        improvementAreas: string[];
      };
      sources: Source[];
      responseId: string; // For feedback collection
    };
    conversationId: string;
    timestamp: string;
  };
}
```

#### POST `/api/chat/study-assistant/stream` - Enhanced Streaming
```typescript
// Enhanced streaming request
interface EnhancedStreamingRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  isPersonalQuery?: boolean;
  conversationId?: string;
  // New streaming options
  streamValidation: boolean;
  qualityMonitoring: boolean;
  realTimeFactCheck: boolean;
  contextLevel: 1 | 2 | 3 | 4;
}

// Enhanced streaming events
interface EnhancedStreamEvent {
  type: 'start' | 'content' | 'validation' | 'quality_update' | 'end' | 'error';
  data: any;
  timestamp: string;
}

// Example streaming events:
// { type: 'start', data: { timestamp, personal, qualityMode } }
// { type: 'content', data: { content, tokens, confidence } }
// { type: 'validation', data: { inputValidated, contextEnhanced, responseValidated } }
// { type: 'quality_update', data: { qualityScore, hallucinationRisk, factCheckProgress } }
// { type: 'end', data: { finalQuality, sources, learningInsights } }
```

## New API Endpoints for Hallucination Prevention

### 1. Input Validation Endpoint
```typescript
// POST /api/hallucination-prevention/validate-input
interface InputValidationRequest {
  input: string;
  validationLevel: 'basic' | 'strict' | 'enhanced';
  userContext?: {
    userId: string;
    conversationId?: string;
  };
}

interface InputValidationResponse {
  success: boolean;
  data: {
    isValid: boolean;
    filteredInput: string;
    validation: {
      sanitization: SanitizationResult;
      classification: QueryClassification;
      safety: SafetyResult;
      format: ValidationResult;
    };
    recommendations: string[];
    riskFactors: RiskFactor[];
  };
}
```

### 2. Response Validation Endpoint
```typescript
// POST /api/hallucination-prevention/validate-response
interface ResponseValidationRequest {
  response: string;
  originalQuery: string;
  context: ContextData;
  validationLevel: 'basic' | 'strict' | 'enhanced';
  userId: string;
}

interface ResponseValidationResponse {
  success: boolean;
  data: {
    isValid: boolean;
    qualityScore: number;
    validation: {
      factual: FactCheckResult;
      logical: LogicCheckResult;
      complete: CompletenessResult;
      consistent: ConsistencyResult;
    };
    issues: ValidationIssue[];
    recommendations: string[];
    confidenceScore: number;
  };
}
```

### 3. Feedback Collection Endpoint
```typescript
// POST /api/hallucination-prevention/feedback
interface FeedbackRequest {
  responseId: string;
  feedback: UserFeedback;
  implicitFeedback?: ImplicitFeedback;
}

interface FeedbackResponse {
  success: boolean;
  data: {
    feedbackId: string;
    processed: boolean;
    learningUpdate: {
      patternsIdentified: string[];
      improvementsMade: string[];
      nextActions: string[];
    };
  };
}

// GET /api/hallucination-prevention/feedback/analytics
interface FeedbackAnalyticsResponse {
  success: boolean;
  data: {
    userFeedback: {
      totalFeedback: number;
      averageRating: number;
      commonIssues: IssuePattern[];
      improvementTrends: TrendData[];
    };
    systemLearning: {
      patternsLearned: LearningPattern[];
      accuracyImprovements: ImprovementMetric[];
      nextOptimizationAreas: string[];
    };
  };
}
```

### 4. Quality Monitoring Endpoint
```typescript
// GET /api/hallucination-prevention/quality/metrics
interface QualityMetricsResponse {
  success: boolean;
  data: {
    currentPeriod: {
      hallucinationRate: number;
      factAccuracy: number;
      userSatisfaction: number;
      responseQuality: number;
    };
    trends: {
      daily: TrendData[];
      weekly: TrendData[];
      monthly: TrendData[];
    };
    alerts: QualityAlert[];
    recommendations: QualityRecommendation[];
  };
}

// GET /api/hallucination-prevention/quality/alerts
interface QualityAlertsResponse {
  success: boolean;
  data: {
    activeAlerts: QualityAlert[];
    resolvedAlerts: QualityAlert[];
    systemHealth: SystemHealthStatus;
  };
}
```

### 5. Knowledge Base Management Endpoints
```typescript
// GET /api/hallucination-prevention/knowledge/search
interface KnowledgeSearchRequest {
  query: string;
  filters?: {
    sourceType?: string;
    reliability?: number;
    topics?: string[];
    dateRange?: { start: string; end: string };
  };
}

interface KnowledgeSearchResponse {
  success: boolean;
  data: {
    results: KnowledgeResult[];
    totalResults: number;
    searchMetadata: {
      confidence: number;
      sourcesUsed: number;
      searchTime: number;
    };
  };
}

// POST /api/hallucination-prevention/knowledge/source
interface AddKnowledgeSourceRequest {
  source: Source;
  verificationData?: VerificationData;
}

interface AddKnowledgeSourceResponse {
  success: boolean;
  data: {
    sourceId: string;
    verificationStatus: string;
    processingTime: number;
  };
}
```

## Middleware and Interceptors

### Input Validation Middleware
```typescript
// middleware.ts or route-specific middleware
export async function validateInput(request: NextRequest): Promise<NextRequest> {
  if (request.method === 'POST') {
    const body = await request.json();
    
    // Run input validation
    const validation = await inputValidator.validate({
      input: body.message,
      validationLevel: body.preferences?.validationLevel || 'basic',
      userContext: {
        userId: getUserIdFromRequest(request),
        conversationId: body.conversationId
      }
    });
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INPUT_VALIDATION_FAILED',
          message: 'Input validation failed',
          details: validation
        }
      }, { status: 400 });
    }
    
    // Attach validation results to request
    (request as any).inputValidation = validation;
  }
  
  return request;
}
```

### Response Validation Interceptor
```typescript
export async function validateResponse(
  response: NextResponse,
  request: NextRequest
): Promise<NextResponse> {
  if (request.method === 'POST' && response.ok) {
    const data = await response.json();
    
    if (data.data?.response && request.body) {
      const validation = await responseValidator.validate({
        response: data.data.response.content,
        originalQuery: (await request.json()).message,
        context: getContextFromRequest(request),
        validationLevel: 'basic',
        userId: getUserIdFromRequest(request)
      });
      
      // Add validation results to response
      data.data.response.validationResults = validation;
      data.data.response.qualityScore = validation.overallScore;
      data.data.response.confidenceScore = validation.confidenceScore;
      
      // If quality is below threshold, flag for review
      if (validation.overallScore < (data.data.response.qualityThreshold || 0.7)) {
        data.data.response.hallucinationRisk = 'medium';
        // Optionally block response
        // return NextResponse.json({ error: 'Quality threshold not met' }, { status: 422 });
      }
      
      // Update response
      return NextResponse.json(data, { status: response.status });
    }
  }
  
  return response;
}
```

## Error Handling Enhancements

### New Error Types for Hallucination Prevention
```typescript
interface HallucinationPreventionError {
  code: string;
  message: string;
  details?: {
    layer: 'input' | 'context' | 'validation' | 'feedback' | 'monitoring';
    validationResult?: ValidationResult;
    riskLevel?: 'low' | 'medium' | 'high';
    recommendedActions?: string[];
    fallbackAvailable?: boolean;
  };
  retryAfter?: number;
}

// Specific error codes
const ERROR_CODES = {
  INPUT_VALIDATION_FAILED: 'INPUT_VALIDATION_FAILED',
  CONTEXT_ENHANCEMENT_FAILED: 'CONTEXT_ENHANCEMENT_FAILED', 
  RESPONSE_VALIDATION_FAILED: 'RESPONSE_VALIDATION_FAILED',
  FACT_CHECK_FAILED: 'FACT_CHECK_FAILED',
  QUALITY_THRESHOLD_NOT_MET: 'QUALITY_THRESHOLD_NOT_MET',
  HALLUCINATION_RISK_HIGH: 'HALLUCINATION_RISK_HIGH',
  FEEDBACK_COLLECTION_FAILED: 'FEEDBACK_COLLECTION_FAILED',
  MONITORING_SYSTEM_ERROR: 'MONITORING_SYSTEM_ERROR'
} as const;
```

## Performance Optimization

### Caching Strategy
```typescript
// Cache validation results
interface ValidationCache {
  inputValidation: Map<string, CachedValidation>;
  responseValidation: Map<string, CachedValidation>;
  knowledgeSearch: Map<string, CachedKnowledgeResults>;
  qualityMetrics: Map<string, CachedMetrics>;
}

// Cache invalidation strategy
const CACHE_TTL = {
  inputValidation: 3600, // 1 hour
  responseValidation: 1800, // 30 minutes
  knowledgeSearch: 7200, // 2 hours
  qualityMetrics: 300 // 5 minutes
};
```

### Batch Processing
```typescript
// Batch validation for multiple requests
interface BatchValidationRequest {
  requests: Array<{
    id: string;
    type: 'input' | 'response';
    data: any;
  }>;
  batchOptions: {
    parallel: boolean;
    priority: 'high' | 'normal' | 'low';
  };
}
```

## Monitoring and Logging

### Enhanced Logging
```typescript
interface HallucinationPreventionLog {
  requestId: string;
  userId: string;
  layer: 'input' | 'context' | 'validation' | 'feedback' | 'monitoring';
  operation: string;
  startTime: number;
  endTime: number;
  success: boolean;
  metrics: {
    processingTime: number;
    qualityScore?: number;
    riskLevel?: string;
  };
  metadata: Record<string, any>;
}
```

### Real-time Monitoring
```typescript
// WebSocket endpoint for real-time quality monitoring
// GET /api/hallucination-prevention/websocket
interface WebSocketMessage {
  type: 'quality_update' | 'alert' | 'system_status';
  data: any;
  timestamp: string;
}
```

## Summary

The API modifications provide:

1. **Backward Compatibility** - All existing endpoints work with optional enhancements
2. **Progressive Enhancement** - New features can be enabled/disabled per request
3. **Comprehensive Validation** - Input, context, and response validation at all layers
4. **Real-time Monitoring** - Live quality metrics and alerts
5. **Feedback Integration** - Seamless user feedback collection and learning
6. **Performance Optimization** - Caching and batch processing for efficiency
7. **Error Resilience** - Graceful degradation and fallback mechanisms

This architecture ensures that the 5-layer hallucination prevention system can be integrated without disrupting existing functionality while providing significant improvements in response quality and reliability.