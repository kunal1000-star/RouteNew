// Feature Flag Context
// ====================
// Context for managing feature flags across the application

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number; // 0-100
  userSegments?: string[];
  environments?: string[];
  dependencies?: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSegment {
  id: string;
  name: string;
  criteria: {
    userType?: 'new' | 'returning' | 'premium' | 'admin';
    activityLevel?: 'low' | 'medium' | 'high';
    studyLevel?: 'beginner' | 'intermediate' | 'advanced';
    deviceType?: 'mobile' | 'desktop' | 'tablet';
    lastActive?: Date;
    totalSessions?: number; // For classification purposes
  };
  description?: string;
}

export interface FeatureFlagContextType {
  flags: Record<string, FeatureFlag>;
  userSegments: Record<string, UserSegment>;
  currentUserSegment: string;
  isFeatureEnabled: (flagName: string, userId?: string) => boolean;
  getFeatureConfig: (flagName: string) => FeatureFlag | null;
  updateFlag: (flagName: string, updates: Partial<FeatureFlag>) => void;
  addUserSegment: (segment: UserSegment) => void;
  setUserSegment: (segmentId: string) => void;
  getEligibleFlags: (userId: string) => FeatureFlag[];
  isLoading: boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

interface FeatureFlagProviderProps {
  children: ReactNode;
  userId?: string;
  userType?: 'new' | 'returning' | 'premium' | 'admin';
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  studyLevel?: 'beginner' | 'intermediate' | 'advanced';
}

// Default feature flags
const defaultFlags: Record<string, FeatureFlag> = {
  // Core chat features
  'universal-chat': {
    name: 'universal-chat',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['development', 'production'],
    description: 'Universal Chat Interface',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'enhanced-chat': {
    name: 'enhanced-chat',
    enabled: true,
    rolloutPercentage: 75,
    userSegments: ['returning', 'premium'],
    environments: ['development', 'production'],
    description: 'Enhanced Chat with Hallucination Prevention',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'feature-flagged-chat': {
    name: 'feature-flagged-chat',
    enabled: true,
    rolloutPercentage: 50,
    userSegments: ['returning'],
    environments: ['development', 'production'],
    description: 'Feature Flagged Chat Interface',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // Hallucination prevention layers
  'layer1-query-classification': {
    name: 'layer1-query-classification',
    enabled: true,
    rolloutPercentage: 100,
    description: 'Layer 1: Query Classification and Safety',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'layer2-memory-context': {
    name: 'layer2-memory-context',
    enabled: true,
    rolloutPercentage: 90,
    userSegments: ['returning', 'premium'],
    description: 'Layer 2: Memory and Context Enhancement',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'layer3-response-validation': {
    name: 'layer3-response-validation',
    enabled: true,
    rolloutPercentage: 80,
    userSegments: ['premium'],
    description: 'Layer 3: Response Validation',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'layer4-personalization': {
    name: 'layer4-personalization',
    enabled: true,
    rolloutPercentage: 70,
    userSegments: ['returning', 'premium'],
    description: 'Layer 4: Personalization Engine',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'layer5-performance': {
    name: 'layer5-performance',
    enabled: true,
    rolloutPercentage: 60,
    userSegments: ['premium'],
    description: 'Layer 5: Performance and Compliance',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // Advanced features
  'web-search-integration': {
    name: 'web-search-integration',
    enabled: true,
    rolloutPercentage: 50,
    userSegments: ['returning'],
    dependencies: ['enhanced-chat'],
    description: 'Web Search Integration',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'memory-references': {
    name: 'memory-references',
    enabled: true,
    rolloutPercentage: 85,
    userSegments: ['returning', 'premium'],
    dependencies: ['layer2-memory-context'],
    description: 'Memory References Display',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'analytics-panel': {
    name: 'analytics-panel',
    enabled: true,
    rolloutPercentage: 40,
    userSegments: ['premium'],
    description: 'Advanced Analytics Panel',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  
  // A/B Testing flags
  'new-chat-ui': {
    name: 'new-chat-ui',
    enabled: false,
    rolloutPercentage: 0,
    environments: ['development'],
    description: 'New Chat UI Design (A/B Test)',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'improved-memory': {
    name: 'improved-memory',
    enabled: true,
    rolloutPercentage: 30,
    userSegments: ['returning'],
    dependencies: ['layer2-memory-context'],
    description: 'Improved Memory System (A/B Test)',
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

// Default user segments
const defaultUserSegments: Record<string, UserSegment> = {
  'new': {
    id: 'new',
    name: 'New Users',
    criteria: {
      userType: 'new',
      totalSessions: 5
    },
    description: 'Users with less than 5 sessions'
  },
  'returning': {
    id: 'returning',
    name: 'Returning Users',
    criteria: {
      userType: 'returning',
      totalSessions: 5
    },
    description: 'Users with 5 or more sessions'
  },
  'premium': {
    id: 'premium',
    name: 'Premium Users',
    criteria: {
      userType: 'premium'
    },
    description: 'Premium/paid users'
  },
  'beginner': {
    id: 'beginner',
    name: 'Beginner Students',
    criteria: {
      studyLevel: 'beginner'
    },
    description: 'Students at beginner level'
  },
  'intermediate': {
    id: 'intermediate',
    name: 'Intermediate Students',
    criteria: {
      studyLevel: 'intermediate'
    },
    description: 'Students at intermediate level'
  },
  'advanced': {
    id: 'advanced',
    name: 'Advanced Students',
    criteria: {
      studyLevel: 'advanced'
    },
    description: 'Students at advanced level'
  },
  'high-activity': {
    id: 'high-activity',
    name: 'High Activity Users',
    criteria: {
      activityLevel: 'high',
      lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    description: 'Users active within last 7 days'
  }
};

export function FeatureFlagProvider({ 
  children, 
  userId, 
  userType = 'new', 
  deviceType = 'desktop',
  studyLevel = 'intermediate'
}: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>(defaultFlags);
  const [userSegments, setUserSegments] = useState<Record<string, UserSegment>>(defaultUserSegments);
  const [currentUserSegment, setCurrentUserSegment] = useState<string>('new');
  const [isLoading, setIsLoading] = useState(true);

  // Determine user segment based on provided criteria
  useEffect(() => {
    const determineSegment = () => {
      if (userType === 'premium') return 'premium';
      if (userType === 'admin') return 'premium'; // Admins get premium features
      
      // Determine based on study level
      if (studyLevel === 'beginner') return 'beginner';
      if (studyLevel === 'advanced') return 'advanced';
      
      // Default to intermediate
      return 'intermediate';
    };

    setCurrentUserSegment(determineSegment());
    setIsLoading(false);
  }, [userType, studyLevel]);

  // Check if a feature is enabled for a user
  const isFeatureEnabled = (flagName: string, targetUserId?: string): boolean => {
    const flag = flags[flagName];
    if (!flag || !flag.enabled) return false;

    // Check environment
    const currentEnv = process.env.NODE_ENV || 'development';
    if (flag.environments && !flag.environments.includes(currentEnv)) {
      return false;
    }

    // Check dependencies
    if (flag.dependencies) {
      for (const dep of flag.dependencies) {
        if (!isFeatureEnabled(dep, targetUserId)) {
          return false;
        }
      }
    }

    // Check user segments
    if (flag.userSegments && flag.userSegments.length > 0) {
      if (!flag.userSegments.includes(currentUserSegment)) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const userHash = (targetUserId || userId || 'anonymous').split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const percentage = Math.abs(userHash) % 100;
      return percentage < flag.rolloutPercentage;
    }

    return true;
  };

  // Get feature configuration
  const getFeatureConfig = (flagName: string): FeatureFlag | null => {
    return flags[flagName] || null;
  };

  // Update a feature flag
  const updateFlag = (flagName: string, updates: Partial<FeatureFlag>) => {
    setFlags(prev => ({
      ...prev,
      [flagName]: {
        ...prev[flagName],
        ...updates,
        updatedAt: new Date()
      }
    }));
  };

  // Add a new user segment
  const addUserSegment = (segment: UserSegment) => {
    setUserSegments(prev => ({
      ...prev,
      [segment.id]: segment
    }));
  };

  // Set current user segment
  const setUserSegment = (segmentId: string) => {
    if (userSegments[segmentId]) {
      setCurrentUserSegment(segmentId);
    }
  };

  // Get all flags eligible for current user
  const getEligibleFlags = (targetUserId?: string): FeatureFlag[] => {
    return Object.values(flags).filter(flag => 
      isFeatureEnabled(flag.name, targetUserId)
    );
  };

  const value: FeatureFlagContextType = {
    flags,
    userSegments,
    currentUserSegment,
    isFeatureEnabled,
    getFeatureConfig,
    updateFlag,
    addUserSegment,
    setUserSegment,
    getEligibleFlags,
    isLoading
  };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}

export default FeatureFlagContext;