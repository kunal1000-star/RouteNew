"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  BookOpen, 
  Target, 
  Award,
  Lightbulb,
  Users,
  Calendar,
  BarChart3,
  Star,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useHallucinationPrevention } from '@/contexts/HallucinationPreventionContext';
import { cn } from '@/lib/utils';

interface LearningInsightsPanelProps {
  className?: string;
  showDetailed?: boolean;
  compact?: boolean;
}

export const LearningInsightsPanel: React.FC<LearningInsightsPanelProps> = ({
  className,
  showDetailed = true,
  compact = false,
}) => {
  const { state, actions } = useHallucinationPrevention();
  const [activeTab, setActiveTab] = useState('progress');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const learningInsights = state.learningInsights;

  const refreshInsights = async () => {
    setIsRefreshing(true);
    try {
      await actions.getLearningInsights();
    } catch (error) {
      console.error('Failed to refresh learning insights:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0.05) return <ArrowUp className="h-3 w-3 text-green-500" />;
    if (trend < -0.05) return <ArrowDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-500" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0.05) return 'text-green-600';
    if (trend < -0.05) return 'text-red-600';
    return 'text-gray-600';
  };

  if (!learningInsights) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading learning insights...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Learning Insights
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshInsights}
            disabled={isRefreshing}
            className="h-6 w-6 p-0"
          >
            <TrendingUp className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 rounded border">
            <div className="text-lg font-bold text-blue-600">
              {learningInsights.totalInteractions}
            </div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>
          <div className="text-center p-2 rounded border">
            <div className="flex items-center justify-center gap-1">
              <span className="text-lg font-bold text-green-600">
                {Math.round(learningInsights.accuracyTrend * 100)}%
              </span>
              {getTrendIcon(learningInsights.accuracyTrend)}
            </div>
            <div className="text-xs text-muted-foreground">Accuracy</div>
          </div>
        </div>
        
        {learningInsights.improvementAreas.length > 0 && (
          <div>
            <div className="text-xs font-medium mb-1">Focus Areas</div>
            <div className="flex flex-wrap gap-1">
              {learningInsights.improvementAreas.slice(0, 2).map((area, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          <h3 className="font-medium text-sm">Learning Insights</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshInsights}
          disabled={isRefreshing}
          className="h-6 w-6 p-0"
        >
          <TrendingUp className="h-3 w-3" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="areas">Focus Areas</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Learning Progress
              </h4>
              <div className="flex items-center gap-1">
                {getTrendIcon(learningInsights.accuracyTrend)}
                <span className={cn("text-sm font-medium", getTrendColor(learningInsights.accuracyTrend))}>
                  {learningInsights.accuracyTrend > 0 ? '+' : ''}{Math.round(learningInsights.accuracyTrend * 100)}%
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Total Sessions</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {learningInsights.totalInteractions}
                </div>
                <p className="text-xs text-muted-foreground">
                  Learning sessions completed
                </p>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Accuracy Trend</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(learningInsights.accuracyTrend * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {learningInsights.accuracyTrend > 0 ? 'Improving' : 
                   learningInsights.accuracyTrend < 0 ? 'Declining' : 'Stable'} performance
                </p>
              </div>
            </div>
          </div>

          {/* Learning Streak */}
          <div className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Learning Streak</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">7 Days</div>
            <p className="text-xs text-muted-foreground">
              Keep up the momentum! You're doing great.
            </p>
          </div>

          {/* Subject Performance */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subject Performance
            </h4>
            <div className="space-y-2">
              {[
                { name: 'Physics', score: 85, trend: 5 },
                { name: 'Chemistry', score: 92, trend: -2 },
                { name: 'Mathematics', score: 78, trend: 8 },
                { name: 'Biology', score: 88, trend: 3 },
              ].map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{subject.name}</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(subject.trend / 100)}
                        <span className={cn("text-xs", getTrendColor(subject.trend / 100))}>
                          {subject.trend > 0 ? '+' : ''}{subject.trend}%
                        </span>
                      </div>
                    </div>
                    <Progress value={subject.score} className="h-1.5" />
                  </div>
                  <span className="text-sm font-medium ml-3">{subject.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="areas" className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Areas for Improvement
            </h4>
            
            {learningInsights.improvementAreas.length > 0 ? (
              <div className="space-y-2">
                {learningInsights.improvementAreas.map((area, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{area}</span>
                      <Badge variant="outline" className="text-xs">
                        Focus Area
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {area === 'Thermodynamics' && 'Practice more problems involving entropy and energy calculations'}
                      {area === 'Integration Techniques' && 'Review substitution and integration by parts methods'}
                      {area === 'Organic Chemistry' && 'Focus on reaction mechanisms and stereochemistry'}
                      {!['Thermodynamics', 'Integration Techniques', 'Organic Chemistry'].includes(area) && 
                        'Continue practicing to improve understanding'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No specific areas need improvement right now!</p>
                <p className="text-xs">Keep up the excellent work.</p>
              </div>
            )}
          </div>

          {/* Learning Patterns */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Learning Patterns</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg text-center">
                <div className="text-lg font-bold text-blue-600">2-4 PM</div>
                <div className="text-xs text-muted-foreground">Peak Performance</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <div className="text-lg font-bold text-purple-600">45 min</div>
                <div className="text-xs text-muted-foreground">Optimal Session</div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Personalized Recommendations
            </h4>
            
            {learningInsights.personalizedRecommendations.length > 0 ? (
              <div className="space-y-2">
                {learningInsights.personalizedRecommendations.map((rec, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-blue-50/50">
                    <div className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{rec}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Based on your learning pattern and performance history
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 border rounded-lg bg-green-50/50">
                  <div className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">🎯 Focus on Thermodynamics</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Practice 30 minutes daily on entropy concepts using visual aids
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg bg-purple-50/50">
                  <div className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-purple-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">📚 Study Strategy</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Schedule difficult topics during your peak hours (2-4 PM)
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg bg-orange-50/50">
                  <div className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">🔄 Review Cycle</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Review Chemistry every 3 days to maintain your excellent performance
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium mb-2">Suggested Next Steps</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Complete 10 practice problems on integration by parts</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Review organic chemistry reaction mechanisms</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Take a practice test in Physics</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      {learningInsights.lastUpdated && (
        <div className="pt-2 border-t text-xs text-muted-foreground">
          Last updated: {learningInsights.lastUpdated.toLocaleString()}
        </div>
      )}
    </Card>
  );
};

export default LearningInsightsPanel;