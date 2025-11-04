# AI System Testing Infrastructure Guide

## Overview

This document provides comprehensive guidance on the AI system's testing infrastructure, built with **Vitest** as the testing framework. The testing setup supports unit tests, integration tests, performance tests, and end-to-end testing for all AI components.

## Testing Framework

- **Primary Framework**: Vitest (fast, Vite-native testing)
- **Mocking**: Vitest's built-in mocking with `vi` utilities
- **Coverage**: v8 coverage provider
- **Environment**: JSDOM for browser environment simulation

## Quick Start

### Install Dependencies

```bash
npm install
# or
pnpm install
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests once and exit
npm run test:run

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui

# Run specific test suites
npm run test:ai           # AI service manager tests
npm run test:providers    # Provider client tests  
npm run test:integration  # Integration tests
npm run test:performance  # Performance tests
```

## Test Structure

### Directory Layout

```
src/
├── test/
│   ├── setup.ts              # Global test configuration
│   ├── mocks/                # Test mocks and fixtures
│   └── fixtures/             # Test data fixtures
├── lib/ai/
│   ├── providers/
│   │   ├── groq-client.test.ts
│   │   ├── gemini-client.test.ts
│   │   └── ...
│   ├── tests/
│   │   ├── ai-service-manager.test.ts    # Core AI service tests
│   │   ├── study-buddy-integration.test.ts # Study buddy integration
│   │   ├── database-integration.test.ts   # Database integration
│   │   ├── chat-system.test.ts           # Chat system integration
│   │   └── performance.test.ts           # Performance benchmarks
│   └── ...
└── ...
```

### Test Categories

#### 1. **Unit Tests** (`src/lib/ai/providers/*.test.ts`)
- Individual provider client functionality
- AI service manager core logic
- Rate limiting and caching components
- Query type detection algorithms

#### 2. **Integration Tests** (`src/lib/ai/tests/*.test.ts`)
- End-to-end AI service workflows
- Database integration with mocked Supabase
- Chat system integration
- Study buddy complete workflows

#### 3. **Performance Tests** (`src/lib/ai/tests/performance.test.ts`)
- Concurrent request handling
- Cache performance benchmarks
- Memory usage under load
- Rate limiting stress tests

#### 4. **Provider Tests** (Individual files per provider)
- API integration testing
- Error handling and recovery
- Rate limit compliance
- Response format validation

## Configuration

### Vitest Configuration (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
});
```

### Test Environment Setup (`src/test/setup.ts`)

Key features:
- Global test utilities and mocks
- Environment variable configuration
- Console method mocking
- Performance timing utilities
- Common test data and fixtures

## Writing Tests

### Unit Test Example

```typescript
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { GroqClient } from './groq-client';

describe('GroqClient', () => {
  let client: GroqClient;
  
  beforeEach(() => {
    vi.clearAllMocks();
    client = new GroqClient('test-api-key');
  });

  test('should handle chat requests correctly', async () => {
    // Mock the fetch API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await client.chat({
      messages: [{ role: 'user', content: 'Hello' }],
      model: 'llama-3.3-70b-versatile'
    });

    expect(result.content).toBeDefined();
    expect(result.provider).toBe('groq');
  });
});
```

### Integration Test Example

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { semanticSearch } from '../semantic-search';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockData }),
        })),
      })),
    })),
  },
}));

describe('Semantic Search Integration', () => {
  test('should search memories with database integration', async () => {
    const result = await semanticSearch.searchMemories({
      userId: 'test-user',
      query: 'thermodynamics',
      limit: 5
    });

    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].similarity).toBeGreaterThan(0.7);
  });
});
```

### Performance Test Example

```typescript
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { aiServiceManager } from '../ai-service-manager';

describe('Performance Tests', () => {
  test('should handle concurrent requests efficiently', async () => {
    const concurrentRequests = 10;
    const requests = Array.from({ length: concurrentRequests }, (_, i) => ({
      userId: `user-${i}`,
      message: `Performance test ${i}`,
      conversationId: 'perf-test',
      chatType: 'general',
      includeAppData: false
    }));

    const startTime = Date.now();
    const responses = await Promise.allSettled(
      requests.map(req => aiServiceManager.processQuery(req))
    );
    const endTime = Date.now();

    const averageResponseTime = (endTime - startTime) / concurrentRequests;
    const successRate = responses.filter(r => r.status === 'fulfilled').length / concurrentRequests;

    expect(averageResponseTime).toBeLessThan(5000); // 5 seconds
    expect(successRate).toBeGreaterThan(0.9); // 90% success rate
  });
});
```

## Mocking Strategy

### External Dependencies

```typescript
// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

// Mock fetch API
global.fetch = vi.fn();

// Mock environment variables
process.env.TESTING = 'true';
```

### AI Provider APIs

```typescript
// Mock provider responses
const mockProviderResponse = {
  content: 'Test response from AI provider',
  model_used: 'test-model',
  provider: 'test-provider',
  tokens_used: { input: 10, output: 20 },
  latency_ms: 1500,
  // ... other required fields
};

(global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve(mockProviderResponse),
} as Response);
```

## Performance Testing

### Key Metrics

- **Response Time**: Average time for AI requests
- **Throughput**: Requests per second handled
- **Error Rate**: Percentage of failed requests
- **Cache Hit Rate**: Effectiveness of caching layer
- **Memory Usage**: Memory consumption patterns
- **Token Processing**: Tokens processed per second

### Performance Benchmarks

```typescript
// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  averageResponseTime: 5000, // 5 seconds
  minimumThroughput: 1,       // 1 request per second
  maximumErrorRate: 0.1,      // 10% error rate
  minimumCacheHitRate: 0.8,   // 80% cache hit rate
  maximumMemoryIncrease: 100 * 1024 * 1024, // 100MB for 100 operations
};
```

### Running Performance Tests

```bash
# Run performance tests only
npm run test:performance

# Run with detailed output
npm run test:performance -- --reporter=verbose

# Run specific performance suites
npm run test:performance -- --grep="AI Service Manager Performance"
```

## CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/ai-testing.yml`)

The CI pipeline runs:

1. **Linting & Type Checking**
2. **Unit Tests** (parallel execution)
3. **Integration Tests** (with test database)
4. **AI Provider Tests** (with API keys)
5. **Performance Tests** (benchmarks)
6. **End-to-End Tests** (full application)

### Required Secrets

```yaml
# Environment variables for CI
env:
  GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  CEREBRAS_API_KEY: ${{ secrets.CEREBRAS_API_KEY }}
  COHERE_API_KEY: ${{ secrets.COHERE_API_KEY }}
  MISTRAL_API_KEY: ${{ secrets.MISTRAL_API_KEY }}
  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

### Test Artifacts

- **Coverage Reports**: HTML and JSON formats
- **Performance Results**: JSON with metrics
- **Test Logs**: Detailed execution logs
- **API Test Results**: Provider health reports

## Coverage Requirements

### Coverage Targets

- **Unit Tests**: 85%+ line coverage
- **Integration Tests**: 70%+ line coverage
- **Performance Tests**: 90%+ coverage of critical paths
- **Overall**: 80%+ combined coverage

### Coverage Commands

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html

# Check coverage thresholds
npm run test:coverage -- --reporter=json
```

## Best Practices

### 1. Test Organization

```typescript
// Use descriptive test names
test('should handle API rate limits gracefully with exponential backoff');

// Group related tests with describe blocks
describe('Error Handling', () => {
  test('should retry on temporary failures');
  test('should fail gracefully on permanent errors');
  test('should log errors with appropriate context');
});
```

### 2. Mocking Guidelines

- **Mock external dependencies** (APIs, databases, file system)
- **Don't mock business logic** being tested
- **Use realistic test data** that matches production patterns
- **Clean up mocks** in afterEach hooks

### 3. Performance Testing

- **Test under realistic load** conditions
- **Measure and assert on performance metrics**
- **Use proper timeouts** for long-running tests
- **Monitor resource usage** during tests

### 4. Test Data Management

```typescript
// Use factory functions for test data
function createMockUser(id: string = 'test-user') {
  return {
    id,
    email: `${id}@test.com`,
    profile: { name: 'Test User' }
  };
}

// Clean up test data after tests
afterEach(() => {
  cleanupTestData();
});
```

## Troubleshooting

### Common Issues

1. **Import Resolution**
   ```typescript
   // Use path aliases correctly
   import { aiServiceManager } from '@/lib/ai/ai-service-manager';
   ```

2. **Mock Cleanup**
   ```typescript
   // Always clean up mocks
   afterEach(() => {
     vi.clearAllMocks();
     vi.restoreAllMocks();
   });
   ```

3. **Async Test Timeouts**
   ```typescript
   // Increase timeout for long-running tests
   test('should handle long operations', async () => {
     // Test code here
   }, 30000); // 30 second timeout
   ```

4. **Coverage Issues**
   ```typescript
   // Ignore non-critical code paths
   /* istanbul ignore next */
   if (process.env.NODE_ENV === 'development') {
     // Development-only code
   }
   ```

### Debug Mode

```bash
# Run tests in debug mode
npm run test:run -- --inspect-brk

# Run specific test file in debug mode
npm run test:run src/lib/ai/providers/groq-client.test.ts --inspect-brk

# Verbose output
npm run test:run -- --reporter=verbose
```

## Test Scripts Reference

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests in watch mode |
| `npm run test:run` | Run tests once and exit |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Run tests with UI interface |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:ai` | Run AI service manager tests |
| `npm run test:providers` | Run provider client tests |
| `npm run test:integration` | Run integration tests |
| `npm run test:performance` | Run performance benchmarks |

## Conclusion

This testing infrastructure provides comprehensive coverage for the AI system, ensuring reliability, performance, and maintainability. The combination of unit tests, integration tests, and performance testing creates a robust foundation for the AI service that can scale with the application's growth.

For questions or issues with the testing setup, refer to the test configuration files or the Vitest documentation.