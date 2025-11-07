import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Filter,
  TrendingUp,
  Lightbulb,
  Target,
  BarChart3,
  Star,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  RefreshCw as RefreshIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import SuggestionCard from './SuggestionCard';
import { useToast } from '@/hooks/use-toast';
import { safeApiCall } from '@/lib/utils/safe-api';

interface Suggestion {
  id: string;
  type: 'topic' | 'weakness' | 'insight' | 'analysis' | 'recommendation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: number;
  reasoning: string;
  actionableSteps: string[];
  relatedTopics?: string[];
  confidenceScore: number;
  metadata?: Record<string, any>;
}

interface AISuggestionsDashboardProps {
  userId?: string;
  className?: string;
  showHeader?: boolean;
  compact?: boolean;
}

const typeIcons = {
  topic: Target,
  weakness: TrendingUp,
  insight: Lightbulb,
  analysis: BarChart3,
  recommendation: Star
};

export function AISuggestionsDashboard({ 
  userId, 
  className,
  showHeader = true,
  compact = false 
}: AISuggestionsDashboardProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();


  // Fetch suggestions on component mount
  useEffect(() => {
    fetchSuggestions();
  }, [userId]);

  const fetchSuggestions = async (refresh = false) => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching AI suggestions...');
      
      const params = new URLSearchParams();
      if (refresh) params.set('refresh', 'true');
      if (selectedFilter !== 'all') params.set('type', selectedFilter);
      
      const result = await safeApiCall(`/api/suggestions?${params}`);
      
      console.log('📡 Suggestions API response:', result);
      
      if (!result.success) {
        if ((result as any).isAuthError) {
          toast({
            title: 'Authentication required',
            description: 'Please sign in to view AI suggestions.',
            variant: 'destructive'
          });
          setSuggestions([]);
          return;
        }
        throw new Error(result.error || 'Failed to fetch suggestions');
      }

      const data = result.data;
      if (data.success && data.suggestions) {
        console.log('✅ Setting suggestions from API response');
        setSuggestions(data.suggestions);
        if (data.cached) {
          toast({
            title: "Suggestions Loaded",
            description: `Loaded ${data.suggestions.length} cached suggestions`,
          });
        }
      } else {
        console.log('⚠️  API response not successful, using empty suggestions');
        setSuggestions([]);
        toast({
          title: "Suggestions Unavailable",
          description: "Unable to load suggestions right now. Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error fetching suggestions:', error);
      setSuggestions([]);
      toast({
        title: "Connection Error",
        description: "Failed to load suggestions. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewSuggestions = async () => {
    try {
      setGenerating(true);
      
      console.log('⚡ Generating new AI suggestions...');
      
      const result = await safeApiCall('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRefresh: true })
      });
      
      console.log('📡 Generation API response:', result);

if (!result.success) {
        if ((result as any).isAuthError) {
          toast({
            title: 'Authentication required',
            description: 'Please sign in to generate AI suggestions.',
            variant: 'destructive'
          });
          return;
        }
        throw new Error(result.error || 'Failed to generate suggestions');
      }
      
      const data = result.data;
      if (data.success) {
        console.log('✅ Suggestions generated successfully');
        toast({
          title: "Suggestions Generated",
          description: `Generated ${data.suggestionsGenerated} new suggestions`,
        });
        
        // Refresh suggestions after generation
        await fetchSuggestions(true);
      } else {
        toast({
          title: "Generation Failed",
          description: data.error || "Failed to generate suggestions. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error generating suggestions:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate new suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleApplySuggestion = async (suggestionId: string) => {
    try {
      console.log('✅ Applying suggestion:', suggestionId);
      
      const result = await safeApiCall(`/api/suggestions?id=${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply' })
      });

if (!result.success) {
        if ((result as any).isAuthError) {
          toast({
            title: 'Authentication required',
            description: 'Please sign in to apply suggestions.',
            variant: 'destructive'
          });
          return;
        }
        throw new Error(result.error || 'Failed to apply suggestion');
      }
      
      const data = result.data;
      if (data.success) {
        console.log('✅ Suggestion applied successfully');
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        toast({
          title: "Suggestion Applied",
          description: "The suggestion has been applied to your study plan.",
        });
      } else {
        toast({
          title: "Apply Failed",
          description: data.error || "Failed to apply suggestion. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error applying suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to apply suggestion. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDismissSuggestion = async (suggestionId: string) => {
    try {
      console.log('🚫 Dismissing suggestion:', suggestionId);
      
      const result = await safeApiCall(`/api/suggestions?id=${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss' })
      });

if (!result.success) {
        if ((result as any).isAuthError) {
          toast({
            title: 'Authentication required',
            description: 'Please sign in to dismiss suggestions.',
            variant: 'destructive'
          });
          return;
        }
        throw new Error(result.error || 'Failed to dismiss suggestion');
      }
      
      const data = result.data;
      if (data.success) {
        console.log('✅ Suggestion dismissed successfully');
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        toast({
          title: "Suggestion Dismissed",
          description: "The suggestion has been dismissed.",
        });
      } else {
        toast({
          title: "Dismiss Failed",
          description: data.error || "Failed to dismiss suggestion. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error dismissing suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss suggestion. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFeedback = async (suggestionId: string, rating: number, comment?: string) => {
    try {
      console.log('💬 Submitting feedback for suggestion:', suggestionId);
      
      const result = await safeApiCall(`/api/suggestions?id=${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'feedback',
          feedbackRating: rating,
          feedbackText: comment
        })
      });

if (!result.success) {
        if ((result as any).isAuthError) {
          toast({
            title: 'Authentication required',
            description: 'Please sign in to submit feedback.',
            variant: 'destructive'
          });
          return;
        }
        throw new Error(result.error || 'Failed to submit feedback');
      }
      
      const data = result.data;
      if (data.success) {
        console.log('✅ Feedback submitted successfully');
        toast({
          title: "Feedback Submitted",
          description: "Thank you for your feedback!",
        });
      } else {
        toast({
          title: "Feedback Failed",
          description: data.error || "Failed to submit feedback. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter suggestions based on current filters
  const filteredSuggestions = suggestions.filter(suggestion => {
    const matchesType = selectedFilter === 'all' || suggestion.type === selectedFilter;
    const matchesPriority = selectedPriority === 'all' || suggestion.priority === selectedPriority;
    const matchesSearch = searchQuery === '' || 
      suggestion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suggestion.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesPriority && matchesSearch;
  });

  // Group suggestions by type
  const suggestionsByType = filteredSuggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.type]) {
      acc[suggestion.type] = [];
    }
    acc[suggestion.type].push(suggestion);
    return acc;
  }, {} as Record<string, Suggestion[]>);

  const renderStats = () => {
    if (compact) return null;
    
    const totalSuggestions = suggestions.length;
    const highPriority = suggestions.filter(s => s.priority === 'high').length;
    const avgConfidence = suggestions.length > 0 
      ? suggestions.reduce((sum, s) => sum + s.confidenceScore, 0) / suggestions.length 
      : 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Suggestions</p>
                <p className="text-2xl font-bold">{totalSuggestions}</p>
              </div>
              <Sparkles className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">{highPriority}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">{Math.round(avgConfidence * 100)}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ready to Apply</p>
                <p className="text-2xl font-bold">
                  {suggestions.filter(s => s.confidenceScore >= 0.8).length}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading AI suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">AI Study Suggestions</h2>
            <p className="text-muted-foreground">
              Personalized recommendations to improve your study performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => fetchSuggestions(true)}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={generateNewSuggestions}
              disabled={generating}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {generating ? 'Generating...' : 'Generate New'}
            </Button>
          </div>
        </div>
      )}

      {!compact && renderStats()}


      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search suggestions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="topic">Study Topics</SelectItem>
            <SelectItem value="weakness">Weak Areas</SelectItem>
            <SelectItem value="insight">Insights</SelectItem>
            <SelectItem value="analysis">Analysis</SelectItem>
            <SelectItem value="recommendation">Recommendations</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
            <SelectItem value="medium">Medium Priority</SelectItem>
            <SelectItem value="low">Low Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Suggestions Display */}
      {filteredSuggestions.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No suggestions available</h3>
            <p className="text-muted-foreground mb-4">
              {suggestions.length === 0 
                ? "Generate your first AI study suggestions to get personalized recommendations."
                : "No suggestions match your current filters. Try adjusting your search criteria."
              }
            </p>
            {suggestions.length === 0 && (
              <Button 
                onClick={generateNewSuggestions}
                disabled={generating}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Suggestions
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">
              All ({filteredSuggestions.length})
            </TabsTrigger>
            {Object.entries(suggestionsByType).map(([type, typeSuggestions]) => {
              const Icon = typeIcons[type as keyof typeof typeIcons];
              return (
                <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {typeSuggestions.length}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {filteredSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={handleApplySuggestion}
                  onDismiss={handleDismissSuggestion}
                  onFeedback={handleFeedback}
                />
              ))}
            </div>
          </TabsContent>

          {Object.entries(suggestionsByType).map(([type, typeSuggestions]) => (
            <TabsContent key={type} value={type} className="space-y-4">
              <div className="grid gap-4">
                {typeSuggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onApply={handleApplySuggestion}
                    onDismiss={handleDismissSuggestion}
                    onFeedback={handleFeedback}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

export default AISuggestionsDashboard;