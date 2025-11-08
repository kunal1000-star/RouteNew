# Layer 1: Input Validation & Preprocessing System

## Overview

Layer 1 is the first defense in the 5-layer hallucination prevention architecture. It provides comprehensive input validation, query classification, and prompt engineering to ensure that only safe, appropriate, and well-formatted inputs reach the AI models.

## Architecture

Layer 1 consists of three main components working in sequence:

```
User Input → InputValidator → QueryClassifier → PromptEngineer → AI Service
                ↓                    ↓              ↓
            Safety Check      Classification    Optimization
            Content Filter    Intent Analysis   Context Integration
            Risk Assessment   Strategy Select   Constraint Injection
```

## Components

### 1. InputValidator
- **Purpose**: Sanitize and validate user input
- **Features**:
  - Content sanitization and filtering
  - Personal information detection and removal
  - Prompt injection detection
  - Inappropriate content filtering
  - Risk assessment and scoring

### 2. QueryClassifier
- **Purpose**: Analyze and classify user queries
- **Features**:
  - Query type detection (factual, study, general, etc.)
  - Complexity assessment (1-5 scale)
  - Context requirement analysis
  - Safety classification
  - Response strategy selection

### 3. PromptEngineer
- **Purpose**: Construct optimized, safe prompts
- **Features**:
  - Safety constraint injection
  - Context-aware prompt construction
  - Response format specification
  - Quality guidelines embedding
  - Source attribution

## Quick Start

### Basic Usage

```typescript
import { processInput, ValidationLevel } from '@/lib/hallucination-prevention/layer1';

const result = await processInput({
  userId: 'user-123',
  message: 'What is photosynthesis?',
  validationLevel: 'strict'
});

console.log('Valid:', result.isValid);
console.log('Type:', result.classification.type);
console.log('Confidence:', result.classification.confidence);
```

### Component-Level Usage

```typescript
import { 
  validateInput, 
  classifyQuery, 
  constructPrompt 
} from '@/lib/hallucination-prevention/layer1';

// Step 1: Validate input
const validation = await validateInput('What is photosynthesis?', 'user-123', 'strict');

// Step 2: Classify query
const classification = await classifyQuery('What is photosynthesis?', 'user-123');

// Step 3: Construct optimized prompt
const prompt = await constructPrompt('What is photosynthesis?', classification);
```

## API Reference

### Core Types

#### ValidationLevel
```typescript
type ValidationLevel = 'basic' | 'strict' | 'enhanced';
```

#### QueryType
```typescript
type QueryType = 'factual' | 'creative' | 'study' | 'general' | 'diagnostic' | 'conversational' | 'analytical';
```

#### ResponseFormat
```typescript
type ResponseFormat = 'plain_text' | 'structured' | 'step_by_step' | 'bulleted' | 'numbered' | 'code' | 'math' | 'table';
```

### Main Interfaces

#### Layer1ProcessingRequest
```typescript
interface Layer1ProcessingRequest {
  userId: string;
  sessionId?: string;
  message: string;
  conversationId?: string;
  chatType?: 'general' | 'study_assistant';
  validationLevel?: ValidationLevel;
  includeAppData?: boolean;
  contextData?: Partial<AppDataContext>;
  options?: PromptConstructionOptions;
  metadata?: Record<string, any>;
}
```

#### Layer1ProcessingResult
```typescript
interface Layer1ProcessingResult {
  isValid: boolean;
  validationResult: ValidationResult;
  classification: QueryClassification;
  optimizedPrompt: OptimizedPrompt;
  processingTime: number;
  recommendations: string[];
  warnings: string[];
  metadata: {
    requestId: string;
    timestamp: string;
    validationLevel: ValidationLevel;
    processingStages: ProcessingStage[];
  };
}
```

## Validation Levels

### Basic
- **Purpose**: Lightweight validation for non-critical applications
- **Features**:
  - Basic content filtering
  - Simple risk assessment
  - Minimal personal information detection
  - Standard prompt injection detection

### Strict (Default)
- **Purpose**: Balanced validation for most applications
- **Features**:
  - Comprehensive content filtering
  - Enhanced personal information detection
  - Advanced prompt injection detection
  - Context-aware safety assessment
  - Detailed logging and monitoring

### Enhanced
- **Purpose**: Maximum security for critical applications
- **Features**:
  - All strict features
  - Advanced pattern recognition
  - Cross-reference validation
  - Detailed audit trails
  - Custom safety rules support

## Configuration

### Service Configuration
```typescript
import { Layer1Service } from '@/lib/hallucination-prevention/layer1';

const config = {
  validationLevel: 'strict',
  enablePromptEngineering: true,
  enableContextIntegration: true,
  enableLogging: true,
  enableMonitoring: true,
  maxProcessingTime: 5000, // 5 seconds
  strictMode: false,
  fallbackEnabled: true
};

const layer1Service = new Layer1Service(config);
```

### Individual Component Configuration

#### InputValidator
```typescript
const validationConfig = {
  validationLevel: 'strict',
  enablePersonalInfoDetection: true,
  enablePromptInjectionDetection: true,
  enableInappropriateContentFiltering: true,
  customFilters: [],
  riskThreshold: 0.7
};
```

#### QueryClassifier
```typescript
const classificationConfig = {
  confidenceThreshold: 0.6,
  enableContextAnalysis: true,
  enableComplexityAssessment: true,
  customClassifiers: [],
  learningMode: false
};
```

#### PromptEngineer
```typescript
const promptConfig = {
  includeUserContext: true,
  includeConversationHistory: true,
  includeKnowledgeBase: true,
  includeExternalSources: false,
  maxContextLength: 2000,
  safetyLevel: 'strict',
  qualityAssurance: true
};
```

## Error Handling

The system provides comprehensive error handling with graceful degradation:

```typescript
try {
  const result = await processInput(request);
  
  if (!result.isValid) {
    console.log('Validation failed:', result.validationResult.filterResult.reasons);
    // Handle invalid input
  }
  
  // Continue with valid input
} catch (error) {
  // System-level error handling
  console.error('Processing failed:', error);
  // Apply fallback or retry logic
}
```

## Performance Considerations

### Processing Time
- **Target**: < 500ms for most inputs
- **Complex queries**: < 2 seconds
- **Fallback timeout**: 5 seconds

### Throughput
- **Concurrent processing**: Up to 100 requests simultaneously
- **Queue management**: Automatic throttling when under load
- **Caching**: Classification results cached for performance

### Resource Usage
- **Memory**: < 50MB per instance
- **CPU**: 1-5% per request
- **Network**: Minimal (no external calls)

## Security Features

### Input Sanitization
- XSS prevention
- SQL injection protection
- Command injection blocking
- Content-type validation

### Personal Information Protection
- Email address detection and masking
- Phone number detection and masking
- Address pattern detection
- Credit card number detection
- Social security number detection

### Prompt Injection Detection
- Direct instruction patterns
- System override attempts
- Role-playing attacks
- Context manipulation
- Ignore instruction patterns

### Content Safety
- Inappropriate content filtering
- Harmful content detection
- Policy violation blocking
- Custom content rules

## Monitoring and Logging

### Built-in Metrics
```typescript
const metrics = layer1Service.getMetrics();
// Returns comprehensive performance metrics
```

### Logging Integration
- Integrated with existing error logging system
- Structured logging with correlation IDs
- Performance metrics collection
- Security event tracking

### Custom Monitoring
```typescript
// Add custom monitoring hooks
layer1Service.on('validationFailed', (data) => {
  // Custom validation failure handling
});

layer1Service.on('highRiskDetected', (data) => {
  // Custom high-risk detection handling
});
```

## Testing

### Test Suite
```typescript
import { runLayer1Tests, quickTest } from '@/lib/hallucination-prevention/layer1/test-layer1';

// Run complete test suite
await runLayer1Tests();

// Quick test of a single input
const result = await quickTest('What is photosynthesis?');
```

### Test Categories
1. **Component Tests**: Individual component validation
2. **Integration Tests**: End-to-end processing
3. **Performance Tests**: Load and stress testing
4. **Security Tests**: Vulnerability and attack detection
5. **Regression Tests**: Backward compatibility

### Manual Testing
```typescript
// Test individual components
await testIndividualComponents();

// Test validation levels
await testValidationLevels();

// Test error handling
await testErrorHandling();
```

## Integration Guide

### With Existing AI Service Manager
```typescript
// Modify existing AI service manager to use Layer 1
async processQuery(request: AIServiceManagerRequest): Promise<AIServiceManagerResponse> {
  // Step 1: Apply Layer 1 processing
  const layer1Result = await layer1Service.processInput({
    userId: request.userId,
    message: request.message,
    validationLevel: 'strict',
    contextData: request.appDataContext
  });

  // Step 2: Check if input is valid
  if (!layer1Result.isValid) {
    return this.getGracefulDegradationResponse('Input validation failed');
  }

  // Step 3: Use optimized prompt for AI service
  const aiResponse = await this.callAIProvider({
    prompt: layer1Result.optimizedPrompt,
    // ... other parameters
  });

  return aiResponse;
}
```

### With Chat System
```typescript
// In chat message handler
export async function handleChatMessage(userId: string, message: string) {
  // Apply Layer 1 preprocessing
  const result = await layer1Service.processInput({
    userId,
    message,
    validationLevel: 'strict',
    includeAppData: true
  });

  // Handle validation failures
  if (!result.isValid) {
    return {
      type: 'validation_error',
      message: 'Your message contains inappropriate content. Please rephrase and try again.',
      suggestions: result.recommendations
    };
  }

  // Continue with valid message
  return await processChatMessage(result);
}
```

### With API Routes
```typescript
// In API route handler
export async function POST(request: Request) {
  try {
    const { userId, message } = await request.json();
    
    const result = await layer1Service.processInput({
      userId,
      message,
      validationLevel: 'strict'
    });

    if (!result.isValid) {
      return NextResponse.json({
        error: 'Invalid input',
        details: result.validationResult.filterResult.reasons,
        suggestions: result.recommendations
      }, { status: 400 });
    }

    // Continue with valid input
    const response = await processMessage(result);
    
    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json({
      error: 'Processing failed',
      message: error.message
    }, { status: 500 });
  }
}
```

## Best Practices

### 1. Always Use Validation Levels
```typescript
// Good: Specify appropriate validation level
await processInput({
  message: userInput,
  validationLevel: 'strict' // For public inputs
});

// Avoid: Using default validation for all inputs
await processInput({ message: userInput });
```

### 2. Handle Gracefully
```typescript
// Good: Handle all scenarios
const result = await processInput(request);

if (!result.isValid) {
  // Log for analysis
  logger.warn('Input validation failed', result);
  
  // Provide user feedback
  return {
    error: 'Invalid input',
    suggestions: result.recommendations
  };
}

// Good: Log for monitoring
logger.info('Input processed', {
  userId: result.userId,
  type: result.classification.type,
  processingTime: result.processingTime
});
```

### 3. Monitor Performance
```typescript
// Monitor processing time
const start = Date.now();
const result = await processInput(request);
const processingTime = Date.now() - start;

if (processingTime > 1000) {
  logger.warn('Slow processing', { processingTime, userId: request.userId });
}
```

### 4. Use Appropriate Fallbacks
```typescript
// Configure fallback behavior
const config = {
  maxProcessingTime: 5000,
  fallbackEnabled: true,
  strictMode: false
};
```

## Troubleshooting

### Common Issues

#### 1. High False Positive Rate
**Symptoms**: Legitimate inputs being flagged as invalid
**Solutions**:
- Lower validation level to 'basic'
- Add custom exception rules
- Review filtering patterns
- Adjust confidence thresholds

#### 2. Slow Performance
**Symptoms**: Processing time > 5 seconds
**Solutions**:
- Enable caching for classifications
- Reduce context length limits
- Disable non-essential features
- Monitor resource usage

#### 3. Memory Leaks
**Symptoms**: Increasing memory usage over time
**Solutions**:
- Limit concurrent requests
- Clear caches periodically
- Review object references
- Monitor garbage collection

### Debug Mode
```typescript
// Enable debug logging
process.env.NODE_ENV = 'development';
const result = await processInput(request);

console.log('Debug Info:', {
  stages: result.metadata.processingStages,
  warnings: result.warnings,
  recommendations: result.recommendations
});
```

## Migration Guide

### From Existing Validation
1. **Audit Current Logic**: Document existing validation rules
2. **Map to New System**: Convert rules to new format
3. **Gradual Rollout**: Start with 'basic' level
4. **Monitor Results**: Track false positives/negatives
5. **Iterate**: Adjust rules based on real usage

### Database Integration
```sql
-- Add validation logging to existing tables
ALTER TABLE chat_messages 
ADD COLUMN validation_result JSONB,
ADD COLUMN layer1_processing_time INTEGER;

-- Query performance
SELECT 
  validation_result->>'riskLevel' as risk_level,
  AVG(processing_time) as avg_processing_time
FROM chat_messages 
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY risk_level;
```

## Contributing

### Development Setup
1. Install dependencies: `npm install`
2. Run tests: `npm test`
3. Build: `npm run build`
4. Lint: `npm run lint`

### Adding New Features
1. Create feature branch
2. Implement in appropriate component
3. Add comprehensive tests
4. Update documentation
5. Submit pull request

### Code Style
- Follow existing TypeScript patterns
- Add JSDoc comments for public APIs
- Include error handling
- Add logging for operations
- Write comprehensive tests

## License

This implementation follows the same license as the main project. See the project root for details.

## Support

For issues and questions:
1. Check this documentation
2. Review test examples
3. Check existing issues
4. Create new issue with details