import React, { useState } from 'react';
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Star,
  CheckCircle,
  XCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  type: 'topic' | 'weakness' | 'insight' | 'analysis' | 'recommendation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: number; // 1-10 scale
  reasoning: string;
  actionableSteps: string[];
  relatedTopics?: string[];
  confidenceScore: number; // 0-1
  metadata?: Record<string, any>;
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onApply?: (suggestionId: string) => void;
  onDismiss?: (suggestionId: string) => void;
  onFeedback?: (suggestionId: string, rating: number, comment?: string) => void;
  showActions?: boolean;
  className?: string;
}

const typeConfig = {
  topic: {
    icon: Target,
    color: 'bg-blue-500',
    label: 'Study Topic',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700'
  },
  weakness: {
    icon: TrendingUp,
    color: 'bg-red-500',
    label: 'Weak Area',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700'
  },
  insight: {
    icon: Lightbulb,
    color: 'bg-yellow-500',
    label: 'Insight',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700'
  },
  analysis: {
    icon: BarChart3,
    color: 'bg-purple-500',
    label: 'Analysis',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700'
  },
  recommendation: {
    icon: Star,
    color: 'bg-green-500',
    label: 'Recommendation',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700'
  }
};

const priorityConfig = {
  low: {
    color: 'bg-gray-100 text-gray-700',
    label: 'Low Priority'
  },
  medium: {
    color: 'bg-orange-100 text-orange-700',
    label: 'Medium Priority'
  },
  high: {
    color: 'bg-red-100 text-red-700',
    label: 'High Priority'
  }
};

export function SuggestionCard({ 
  suggestion, 
  onApply, 
  onDismiss, 
  onFeedback,
  showActions = true,
  className 
}: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const config = typeConfig[suggestion.type];
  const Icon = config.icon;
  const priorityStyle = priorityConfig[suggestion.priority];

  const handleApply = () => {
    if (onApply) {
      onApply(suggestion.id);
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(suggestion.id);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (onFeedback && feedbackRating > 0) {
      setIsSubmittingFeedback(true);
      try {
        await onFeedback(suggestion.id, feedbackRating, feedbackComment);
        setShowFeedbackDialog(false);
        setFeedbackRating(0);
        setFeedbackComment('');
      } catch (error) {
        console.error('Error submitting feedback:', error);
      } finally {
        setIsSubmittingFeedback(false);
      }
    }
  };

  const renderConfidenceBar = () => {
    const confidencePercentage = Math.round(suggestion.confidenceScore * 100);
    const confidenceColor = confidencePercentage >= 80 ? 'bg-green-500' : 
                           confidencePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={cn('h-2 rounded-full transition-all', confidenceColor)}
            style={{ width: `${confidencePercentage}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {confidencePercentage}% confidence
        </span>
      </div>
    );
  };

  const renderImpactBar = () => {
    const impactPercentage = (suggestion.estimatedImpact / 10) * 100;
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
            style={{ width: `${impactPercentage}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {suggestion.estimatedImpact}/10 impact
        </span>
      </div>
    );
  };

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      config.bgColor,
      config.borderColor,
      'border-l-4',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.color)}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={cn(priorityStyle.color)}>
                  {priorityStyle.label}
                </Badge>
                <Badge variant="outline" className={cn(config.textColor)}>
                  {config.label}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg mt-1">{suggestion.title}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">
              {Math.round(suggestion.confidenceScore * 100)}%
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{suggestion.description}</p>

        {/* Confidence and Impact Bars */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium">Confidence</span>
            </div>
            {renderConfidenceBar()}
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium">Estimated Impact</span>
            </div>
            {renderImpactBar()}
          </div>
        </div>

        {/* Expandable Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              {isExpanded ? 'Show Less' : 'Show Details'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">AI Reasoning</h4>
              <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Actionable Steps</h4>
              <ul className="space-y-1">
                {suggestion.actionableSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {suggestion.relatedTopics && suggestion.relatedTopics.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Related Topics</h4>
                <div className="flex flex-wrap gap-1">
                  {suggestion.relatedTopics.map((topic, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleApply}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Apply
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Dismiss
            </Button>

            <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Feedback</DialogTitle>
                  <DialogDescription>
                    How helpful was this suggestion?
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Rating</Label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          variant={feedbackRating >= rating ? "default" : "outline"}
                          size="icon"
                          onClick={() => setFeedbackRating(rating)}
                        >
                          {feedbackRating >= rating ? (
                            <ThumbsUp className="h-4 w-4" />
                          ) : (
                            <span>{rating}</span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Additional Comments (Optional)</Label>
                    <Textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Tell us more about this suggestion..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleFeedbackSubmit}
                      disabled={feedbackRating === 0 || isSubmittingFeedback}
                      className="flex-1"
                    >
                      {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowFeedbackDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SuggestionCard;
