// UniversalChatWithFeatureFlags - Feature-Flagged Component
// ==========================================================
// Uses feature flag system for progressive feature rollout and A/B testing

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UniversalChat } from './UniversalChat';
import { UniversalChatEnhanced } from './UniversalChatEnhanced';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useStudyBuddy } from '@/hooks/use-study-buddy';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Switch,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui';
import {
  Settings,
  Zap,
  Eye,
  Users,
  Activity,
  Target,
  BarChart3,
  Shield,
  Brain,
  Globe,
  Layers,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudyContext } from '@/types/study-buddy';

interface UniversalChatWithFeatureFlagsProps {
  className?: string;
  initialStudyContext?: Partial<StudyContext>;
  userId?: string;
  userType?: 'new' | 'returning' | 'premium' | 'admin';
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  studyLevel?: 'beginner' | 'intermediate' | 'advanced';
  theme?: 'light' | 'dark' | 'auto';
}

export function UniversalChatWithFeatureFlags({
  className = '',
  initialStudyContext,
  userId,
  userType = 'new',
  deviceType = 'desktop',
  studyLevel = 'intermediate',
  theme = 'auto'
}: UniversalChatWithFeatureFlagsProps) {
  const { toast } = useToast();
  const {
    messages,
    isLoading,
    sessionId,
    conversationId,
    profileData,
    handleSendMessage,
    startNewChat,
    clearChat
  } = useStudyBuddy();

  const {
    flags,
    currentUserSegment,
    isFeatureEnabled,
    getFeatureConfig,
    isLoading: flagsLoading
  } = useFeatureFlags();

  // Local state for feature flag management
  const [selectedChatVariant, setSelectedChatVariant] = useState<'base' | 'enhanced'>('base');
  const [showFeaturePanel, setShowFeaturePanel] = useState(false);
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);
  const [abTestResults, setAbTestResults] = useState<any>(null);

  // Determine which chat component to use based on feature flags
  useEffect(() => {
    if (flagsLoading) return;

    // Check for specific feature flag combinations
    const hasEnhancedChat = isFeatureEnabled('enhanced-chat', userId);
    const hasUniversalChat = isFeatureEnabled('universal-chat', userId);
    const hasFeatureFlaggedChat = isFeatureEnabled('feature-flagged-chat', userId);

    // A/B test for new chat UI
    if (isFeatureEnabled('new-chat-ui', userId)) {
      setSelectedChatVariant('enhanced');
    } else if (hasEnhancedChat && currentUserSegment !== 'new') {
      setSelectedChatVariant('enhanced');
    } else {
      setSelectedChatVariant('base');
    }

    // Collect enabled features
    const enabled = Object.keys(flags).filter(flagName => 
      isFeatureEnabled(flagName, userId)
    );
    setEnabledFeatures(enabled);

    // Check for A/B test participation
    if (isFeatureEnabled('new-chat-ui', userId)) {
      // User is in the new UI test group
      setAbTestResults({
        testName: 'new-chat-ui',
        variant: 'treatment',
        enabled: true,
        features: enabled
      });
    }
  }, [flags, currentUserSegment, userId, flagsLoading, isFeatureEnabled]);

  // Feature flag override for testing/development
  const [featureOverrides, setFeatureOverrides] = useState<Record<string, boolean>>({});

  // Check if specific feature is enabled (with override support)
  const isFeatureEnabledWithOverride = useCallback((flagName: string): boolean => {
    if (featureOverrides.hasOwnProperty(flagName)) {
      return featureOverrides[flagName];
    }
    return isFeatureEnabled(flagName, userId);
  }, [isFeatureEnabled, featureOverrides, userId]);

  // Override a feature flag for testing
  const overrideFeature = (flagName: string, enabled: boolean) => {
    setFeatureOverrides(prev => ({
      ...prev,
      [flagName]: enabled
    }));
  };

  // Get available features for current user
  const getAvailableFeatures = useCallback(() => {
    const allFeatures = {
      // Core features
      'universal-chat': 'Universal Chat Interface',
      'enhanced-chat': 'Enhanced Chat with Hallucination Prevention',
      'feature-flagged-chat': 'Feature Flagged Chat Interface',
      
      // Hallucination prevention layers
      'layer1-query-classification': 'Layer 1: Query Classification',
      'layer2-memory-context': 'Layer 2: Memory & Context',
      'layer3-response-validation': 'Layer 3: Response Validation',
      'layer4-personalization': 'Layer 4: Personalization',
      'layer5-performance': 'Layer 5: Performance & Compliance',
      
      // Advanced features
      'web-search-integration': 'Web Search Integration',
      'memory-references': 'Memory References Display',
      'analytics-panel': 'Advanced Analytics Panel',
      
      // A/B Tests
      'new-chat-ui': 'New Chat UI Design',
      'improved-memory': 'Improved Memory System'
    };

    return Object.entries(allFeatures).map(([key, label]) => ({
      name: key,
      label,
      enabled: isFeatureEnabledWithOverride(key),
      config: getFeatureConfig(key)
    }));
  }, [isFeatureEnabledWithOverride, getFeatureConfig]);

  const availableFeatures = getAvailableFeatures();

  // Calculate feature health score
  const getFeatureHealthScore = useCallback(() => {
    const activeFeatures = availableFeatures.filter(f => f.enabled).length;
    const totalFeatures = availableFeatures.length;
    return Math.round((activeFeatures / totalFeatures) * 100);
  }, [availableFeatures]);

  // Render the appropriate chat component
  const renderChatComponent = () => {
    const commonProps = {
      className: '',
      initialStudyContext,
      theme
    };

    if (selectedChatVariant === 'enhanced') {
      if (!isFeatureEnabledWithOverride('enhanced-chat')) {
        console.warn('Enhanced chat not available, falling back to base chat');
        return <UniversalChat {...commonProps} />;
      }

      return (
        <UniversalChatEnhanced
          {...commonProps}
          enableHallucinationPrevention={isFeatureEnabledWithOverride('layer1-query-classification')}
          showMemoryReferences={isFeatureEnabledWithOverride('memory-references')}
          showPersonalizationIndicators={isFeatureEnabledWithOverride('layer4-personalization')}
          enableWebSearch={isFeatureEnabledWithOverride('web-search-integration')}
          showLayerStatus={isFeatureEnabledWithOverride('layer1-query-classification')}
          showAnalytics={isFeatureEnabledWithOverride('analytics-panel')}
        />
      );
    }

    return <UniversalChat {...commonProps} />;
  };

  // Feature flag management functions
  const enableAllFeatures = () => {
    const newOverrides: Record<string, boolean> = {};
    availableFeatures.forEach(feature => {
      newOverrides[feature.name] = true;
    });
    setFeatureOverrides(newOverrides);
    toast({
      title: 'All Features Enabled',
      description: `Enabled ${availableFeatures.length} features for testing`
    });
  };

  const disableAllFeatures = () => {
    setFeatureOverrides({});
    toast({
      title: 'Feature Overrides Cleared',
      description: 'All feature overrides have been removed'
    });
  };

  const resetToDefaults = () => {
    setFeatureOverrides({});
    setSelectedChatVariant('base');
    toast({
      title: 'Reset to Defaults',
      description: 'All features reset to their default state'
    });
  };

  if (flagsLoading) {
    return (
      <Card className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading feature flags...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Feature Flag Status Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span>Feature Flags</span>
              <Badge variant="outline" className="ml-2">
                {currentUserSegment}
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {enabledFeatures.length} enabled
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFeaturePanel(!showFeaturePanel)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showFeaturePanel && (
          <CardContent>
            <div className="space-y-4">
              {/* Feature Health Score */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Feature Health</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-muted-foreground">
                    {getFeatureHealthScore()}%
                  </div>
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-green-500 rounded-full transition-all"
                      style={{ width: `${getFeatureHealthScore()}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* A/B Test Results */}
              {abTestResults && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">A/B Test Active</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div>Test: {abTestResults.testName}</div>
                    <div>Variant: {abTestResults.variant}</div>
                    <div>Features: {abTestResults.features.length} enabled</div>
                  </div>
                </div>
              )}

              {/* Feature List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Available Features</span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={enableAllFeatures}
                      className="text-xs"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Enable All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disableAllFeatures}
                      className="text-xs"
                    >
                      Clear Overrides
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetToDefaults}
                      className="text-xs"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {availableFeatures.map((feature) => (
                    <div
                      key={feature.name}
                      className="flex items-center justify-between p-2 border rounded text-xs"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{feature.label}</div>
                        {feature.config?.rolloutPercentage !== undefined && (
                          <div className="text-muted-foreground">
                            {feature.config.rolloutPercentage}% rollout
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {feature.enabled ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-gray-400" />
                        )}
                        <Switch
                          checked={feature.enabled}
                          onCheckedChange={(checked) => 
                            overrideFeature(feature.name, checked)
                          }
                          size="sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Current Chat Variant Indicator */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Layers className="h-3 w-3" />
                <span>Variant: {selectedChatVariant}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>Segment: {currentUserSegment}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Session: {sessionId?.slice(0, 8)}...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Chat Interface */}
      <div className="min-h-[600px]">
        {renderChatComponent()}
      </div>
    </div>
  );
}

export default UniversalChatWithFeatureFlags;