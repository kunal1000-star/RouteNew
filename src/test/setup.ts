// Test Setup Configuration
// =======================

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables for testing
process.env.TESTING = 'true';

// Mock global objects that might not exist in test environment
if (typeof global.fetch === 'undefined') {
  global.fetch = vi.fn();
}

// Mock console methods to reduce test noise
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Uncomment these lines to silence console output during tests:
// console.log = vi.fn();
// console.warn = vi.fn();
// console.error = vi.fn();

// Restore console methods for debugging
export const restoreConsole = () => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
};

// Global test utilities
export const createMockResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
});

export const createMockError = (message: string, status = 500) => {
  const error = new Error(message);
  (error as any).status = status;
  return error;
};

// Mock timing functions for consistent testing
export const mockTimers = () => {
  vi.useFakeTimers();
  return {
    advanceTimeBy: (ms: number) => vi.advanceTimersByTime(ms),
    runAllTimers: () => vi.runAllTimers(),
    clearAllTimers: () => vi.clearAllTimers(),
    restore: () => vi.useRealTimers(),
  };
};

// Test timeout configuration
export const TIMEOUTS = {
  short: 1000,
  medium: 5000,
  long: 10000,
  aiProvider: 30000,
};

// Common test data
export const TEST_USERS = {
  student: {
    id: 'test-student-123',
    email: 'student@test.com',
    profile: {
      name: 'Test Student',
      level: 'JEE 2025',
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
    },
  },
  admin: {
    id: 'test-admin-456',
    email: 'admin@test.com',
    role: 'admin',
  },
};

export const TEST_CONVERSATIONS = {
  personal: {
    id: 'conv-personal-123',
    userId: TEST_USERS.student.id,
    type: 'study_assistant',
    messages: [
      {
        role: 'user',
        content: 'Mera Physics kaisa chal raha hai?',
        timestamp: new Date().toISOString(),
      },
    ],
  },
  general: {
    id: 'conv-general-456',
    userId: TEST_USERS.student.id,
    type: 'general',
    messages: [
      {
        role: 'user',
        content: 'What is quantum physics?',
        timestamp: new Date().toISOString(),
      },
    ],
  },
};

export const MOCK_AI_RESPONSES = {
  personalQuestion: {
    content: 'Based on your recent performance, your Physics score has improved from 65% to 78% over the past month.',
    model_used: 'llama-3.3-70b-versatile',
    provider: 'groq',
    query_type: 'app_data',
    tier_used: 1,
    cached: false,
    tokens_used: { input: 45, output: 67 },
    latency_ms: 1200,
    web_search_enabled: false,
    fallback_used: false,
    limit_approaching: false,
  },
  generalQuestion: {
    content: 'Quantum physics is a fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles.',
    model_used: 'llama-3.3-70b-versatile',
    provider: 'groq',
    query_type: 'general',
    tier_used: 1,
    cached: false,
    tokens_used: { input: 35, output: 89 },
    latency_ms: 980,
    web_search_enabled: false,
    fallback_used: false,
    limit_approaching: false,
  },
  timeSensitive: {
    content: 'Based on current information, JEE Main 2025 registration is expected to open in December 2024.',
    model_used: 'gemini-2.0-flash-lite',
    provider: 'gemini',
    query_type: 'time_sensitive',
    tier_used: 1,
    cached: false,
    tokens_used: { input: 28, output: 45 },
    latency_ms: 750,
    web_search_enabled: true,
    fallback_used: false,
    limit_approaching: false,
  },
};

// Clean up function called after each test
export const cleanup = () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
};