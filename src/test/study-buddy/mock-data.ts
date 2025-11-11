import { StudyBuddySettings } from '@/types/settings';

export const mockStudyBuddySettings: StudyBuddySettings = {
  endpoints: {
    chat: {
      provider: 'groq',
      model: 'llama3-8b-8192',
      enabled: true,
      timeout: 30,
      testStatus: 'success',
      lastTested: new Date().toISOString(),
      error: undefined
    },
    embeddings: {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      enabled: true,
      timeout: 45,
      testStatus: 'success',
      lastTested: new Date().toISOString(),
      error: undefined
    },
    memoryStorage: {
      provider: 'cerebras',
      model: 'llama3-8b',
      enabled: false,
      timeout: 30,
      testStatus: undefined,
      lastTested: undefined,
      error: undefined
    },
    orchestrator: {
      provider: 'mistral',
      model: 'mistral-small-latest',
      enabled: true,
      timeout: 60,
      testStatus: 'failed',
      lastTested: new Date().toISOString(),
      error: 'Connection timeout'
    },
    personalized: {
      provider: 'cohere',
      model: 'command-r',
      enabled: true,
      timeout: 35,
      testStatus: 'success',
      lastTested: new Date().toISOString(),
      error: undefined
    },
    semanticSearch: {
      provider: 'openrouter',
      model: 'llama3.1-8b',
      enabled: false,
      timeout: 40,
      testStatus: undefined,
      lastTested: undefined,
      error: undefined
    },
    webSearch: {
      provider: 'groq',
      model: 'llama3-70b-8192',
      enabled: true,
      timeout: 50,
      testStatus: 'success',
      lastTested: new Date().toISOString(),
      error: undefined
    }
  },
  globalDefaults: {
    provider: 'groq',
    model: 'llama3-8b-8192'
  },
  enableHealthMonitoring: true,
  testAllEndoints: true
};

export const mockUserSettings = {
  aiModel: {
    preferredProviders: ['groq', 'gemini', 'mistral'],
    qualitySettings: {
      responseQuality: 'balanced' as const,
      temperature: 0.7
    },
    rateLimits: {
      dailyRequests: 1000,
      hourlyRequests: 100,
      concurrentRequests: 10
    }
  },
  features: {
    aiSuggestions: {
      enabled: true,
      frequency: 'real-time' as const,
      categories: {
        flashcards: true,
        summaries: true,
        quizzes: false,
        explanations: true
      }
    },
    studyModes: {
      primaryMode: 'concept-learning' as const,
      sessionLength: 25,
      difficultyAdaptation: true
    }
  },
  notifications: {
    pushNotifications: {
      enabled: true,
      newFeatures: true,
      studyReminders: true,
      aiUpdates: false
    },
    emailNotifications: {
      enabled: false,
      weeklySummary: false,
      importantUpdates: true
    }
  },
  privacy: {
    dataCollection: {
      usageAnalytics: true,
      performanceMetrics: true,
      errorReporting: false
    },
    aiDataProcessing: {
      personalizeResponses: true,
      improveModels: false,
      trainNewFeatures: false
    },
    dataRetention: {
      deleteAfterDays: 90,
      automaticCleanup: true
    },
    sharingControls: {
      anonymousAnalytics: true,
      featureUsage: false,
      errorReports: false
    }
  },
  usage: {
    displayOptions: {
      showStatistics: true,
      showProgress: true,
      showAchievements: true
    },
    dataVisualization: {
      preferredChartType: 'bar' as const,
      timeRange: 'week' as const,
      showTrends: true,
      showComparisons: false
    }
  },
  studyBuddy: mockStudyBuddySettings
};

export const mockUsageStats = {
  totalSessions: 156,
  totalStudyTime: 7800, // in minutes
  aiRequestsMade: 2340,
  studyStreak: {
    current: 12,
    longest: 25
  },
  tokenUsage: {
    byProvider: {
      groq: 45000,
      gemini: 32000,
      mistral: 28000,
      cerebras: 15000,
      cohere: 12000,
      openrouter: 8000
    },
    total: 140000,
    cost: 45.67
  },
  featureUsage: {
    chat: 85,
    embeddings: 65,
    memory: 45,
    search: 70
  }
};