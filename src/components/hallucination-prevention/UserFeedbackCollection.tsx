"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  MessageSquare, 
  Star,
  X,
  Send,
  CheckCircle
} from 'lucide-react';
import { useHallucinationPrevention, UserFeedback } from '@/contexts/HallucinationPreventionContext';
import { cn } from '@/lib/utils';

interface UserFeedbackCollectionProps {
  responseId: string;
  responseText: string;
  qualityScore?: number;
  onSubmit: (feedback: UserFeedback) => void;
  onClose: () => void;
  isOpen: boolean;
  className?: string;
}

export const UserFeedbackCollection: React.FC<UserFeedbackCollectionProps> = ({
  responseId,
  responseText,
  qualityScore,
  onSubmit,
  onClose,
  isOpen,
  className,
}) => {
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | 'correction' | 'flag'>('positive');
  const [rating, setRating] = useState<number>(0);
  const [corrections, setCorrections] = useState<string>('');
  const [flagReasons, setFlagReasons] = useState<string[]>([]);
  const [additionalComments, setAdditionalComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { actions } = useHallucinationPrevention();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const feedback: UserFeedback = {
        id: crypto.randomUUID(),
        responseId,
        type: feedbackType,
        rating: (feedbackType === 'positive' || feedbackType === 'negative') ? rating : undefined,
        corrections: feedbackType === 'correction' ? corrections : undefined,
        flagReasons: feedbackType === 'flag' ? flagReasons : undefined,
        feedbackText: additionalComments || undefined,
        timestamp: new Date(),
      };
      
      await actions.submitFeedback(feedback);
      onSubmit(feedback);
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFlagReason = (reason: string) => {
    setFlagReasons(prev => 
      prev.includes(reason) 
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'positive': return <ThumbsUp className="h-4 w-4" />;
      case 'negative': return <ThumbsDown className="h-4 w-4" />;
      case 'correction': return <MessageSquare className="h-4 w-4" />;
      case 'flag': return <Flag className="h-4 w-4" />;
      default: return <ThumbsUp className="h-4 w-4" />;
    }
  };

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-50 border-green-200 text-green-700';
      case 'negative': return 'bg-red-50 border-red-200 text-red-700';
      case 'correction': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'flag': return 'bg-orange-50 border-orange-200 text-orange-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const flagReasonOptions = [
    'Factually incorrect',
    'Inappropriate content', 
    'Harmful or dangerous',
    'Spam or irrelevant',
    'Violates policies',
    'Hallucination detected',
    'Low educational value',
    'Other'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={cn("w-full max-w-2xl max-h-[90vh] overflow-y-auto", className)}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Help us improve this response</h3>
              <p className="text-sm text-muted-foreground">
                Your feedback helps us identify and fix issues in our AI responses
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Response Preview */}
          {qualityScore && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Response Preview</span>
                <Badge variant="outline">
                  Quality: {Math.round(qualityScore * 100)}%
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {responseText.length > 200 ? `${responseText.substring(0, 200)}...` : responseText}
              </p>
            </div>
          )}

          {/* Feedback Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">How would you rate this response?</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={feedbackType === 'positive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackType('positive')}
                className="justify-start h-auto p-3"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Helpful</div>
                  <div className="text-xs text-muted-foreground">Accurate and useful</div>
                </div>
              </Button>
              
              <Button
                variant={feedbackType === 'negative' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackType('negative')}
                className="justify-start h-auto p-3"
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Not Helpful</div>
                  <div className="text-xs text-muted-foreground">Lacks accuracy or value</div>
                </div>
              </Button>
              
              <Button
                variant={feedbackType === 'correction' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackType('correction')}
                className="justify-start h-auto p-3"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Needs Correction</div>
                  <div className="text-xs text-muted-foreground">Contains errors</div>
                </div>
              </Button>
              
              <Button
                variant={feedbackType === 'flag' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackType('flag')}
                className="justify-start h-auto p-3"
              >
                <Flag className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Report Issue</div>
                  <div className="text-xs text-muted-foreground">Inappropriate or harmful</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Rating Stars (for positive/negative feedback) */}
          {(feedbackType === 'positive' || feedbackType === 'negative') && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rate this response</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={cn(
                        "h-6 w-6",
                        star <= rating 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-gray-300"
                      )}
                    />
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {rating <= 2 && "Poor - contains significant errors or issues"}
                {rating === 3 && "Fair - some good points but room for improvement"}
                {rating === 4 && "Good - accurate and helpful with minor issues"}
                {rating === 5 && "Excellent - highly accurate and valuable"}
              </p>
            </div>
          )}

          {/* Correction Text (for correction feedback) */}
          {feedbackType === 'correction' && (
            <div className="space-y-2">
              <Label htmlFor="corrections" className="text-sm font-medium">
                What should be corrected?
              </Label>
              <Textarea
                id="corrections"
                placeholder="Please provide the correct information or point out the specific errors..."
                value={corrections}
                onChange={(e) => setCorrections(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about what information is incorrect and provide the correct details when possible.
              </p>
            </div>
          )}

          {/* Flag Reasons (for flag feedback) */}
          {feedbackType === 'flag' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">What's wrong with this response?</Label>
              <div className="grid grid-cols-2 gap-2">
                {flagReasonOptions.map((reason) => (
                  <label
                    key={reason}
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors",
                      flagReasons.includes(reason) 
                        ? "bg-orange-50 border-orange-200" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={flagReasons.includes(reason)}
                      onChange={() => toggleFlagReason(reason)}
                      className="rounded"
                    />
                    <span className="text-sm">{reason}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Additional Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-sm font-medium">
              Additional comments (optional)
            </Label>
            <Textarea
              id="comments"
              placeholder="Any other feedback you'd like to share about this response..."
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              <span>Your feedback is anonymous and helps improve AI quality</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={
                  isSubmitting ||
                  (feedbackType === 'positive' || feedbackType === 'negative') ? rating === 0 :
                  feedbackType === 'correction' ? corrections.trim() === '' :
                  feedbackType === 'flag' ? flagReasons.length === 0 : false
                }
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-3 w-3" />
                    <span>Submit Feedback</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserFeedbackCollection;