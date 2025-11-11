// Save Dialog Component
// =====================
// Comprehensive save dialog with options for individual messages, conversations, and highlighted text

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  MessageCircle, 
  FileText, 
  Highlighter, 
  Sparkles, 
  Download,
  Settings,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/study-buddy';

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    type: 'message' | 'conversation' | 'highlighted_text';
    message?: ChatMessage;
    conversation?: ChatMessage[];
    highlightedText?: string;
    context?: {
      conversationId?: string;
      userId?: string;
      subject?: string;
      timestamp?: Date;
    };
  };
  onSave: (saveOptions: SaveOptions) => Promise<void>;
  userPreferences?: {
    defaultFormat?: 'txt' | 'pdf' | 'docx' | 'markdown';
    aiEnhancement?: boolean;
    autoSummarize?: boolean;
    preferredFolder?: string;
  };
}

interface SaveOptions {
  type: 'message' | 'conversation' | 'highlighted_text';
  fileName: string;
  format: 'txt' | 'pdf' | 'docx' | 'markdown';
  folder: string;
  options: {
    aiEnhancement: boolean;
    includeMetadata: boolean;
    createSummary: boolean;
    addTags: boolean;
    includeConversationContext: boolean;
  };
  tags: string[];
  notes: string;
}

export function SaveDialog({
  isOpen,
  onClose,
  content,
  onSave,
  userPreferences = {}
}: SaveDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveOptions, setSaveOptions] = useState<SaveOptions>({
    type: content.type,
    fileName: generateFileName(content),
    format: userPreferences.defaultFormat || 'txt',
    folder: userPreferences.preferredFolder || 'StudyBuddy/Saved Content',
    options: {
      aiEnhancement: userPreferences.aiEnhancement ?? true,
      includeMetadata: true,
      createSummary: userPreferences.autoSummarize ?? true,
      addTags: true,
      includeConversationContext: content.type === 'message',
    },
    tags: [],
    notes: ''
  });

  const [aiAnalysis, setAiAnalysis] = useState<{
    topics: string[];
    keyConcepts: string[];
    summary: string;
    studyTips: string[];
  } | null>(null);

  // Generate file name based on content
  function generateFileName(content: any): string {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS

    switch (content.type) {
      case 'message':
        const messagePreview = content.message?.content?.substring(0, 30) || 'message';
        const cleanPreview = messagePreview.replace(/[^a-zA-Z0-9]/g, '_');
        return `message_${cleanPreview}_${timestamp}_${time}.txt`;
      
      case 'conversation':
        return `conversation_${timestamp}_${time}.txt`;
      
      case 'highlighted_text':
        return `highlight_${timestamp}_${time}.txt`;
      
      default:
        return `content_${timestamp}_${time}.txt`;
    }
  }

  // Simulate AI analysis (in real implementation, this would call the AI service)
  const runAiAnalysis = async () => {
    if (!saveOptions.options.aiEnhancement) return;

    setSaveProgress(20);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaveProgress(40);

    // Mock AI analysis
    const mockAnalysis = {
      topics: ['Study', 'Learning', 'Education'],
      keyConcepts: ['Important concept', 'Key idea', 'Main point'],
      summary: 'This content covers important study material with key concepts and learning objectives.',
      studyTips: ['Review regularly', 'Take notes', 'Practice examples']
    };

    setAiAnalysis(mockAnalysis);
    setSaveProgress(60);
  };

  useEffect(() => {
    if (isOpen && saveOptions.options.aiEnhancement) {
      runAiAnalysis();
    }
  }, [isOpen, saveOptions.options.aiEnhancement]);

  const handleSave = async () => {
    if (!saveOptions.fileName.trim()) {
      toast({
        title: 'File name required',
        description: 'Please enter a file name for the saved content.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    setSaveProgress(70);

    try {
      await onSave(saveOptions);
      setSaveProgress(100);
      
      toast({
        title: 'Content saved successfully',
        description: `${saveOptions.fileName} has been saved to Google Drive.`,
      });

      // Close dialog after successful save
      setTimeout(() => {
        onClose();
        setSaveProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save content to Google Drive. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatSize = (content: any) => {
    const text = content.type === 'conversation' 
      ? content.conversation?.map((m: ChatMessage) => m.content).join('\n') || ''
      : content.type === 'message'
      ? content.message?.content || ''
      : content.highlightedText || '';
    
    const bytes = new TextEncoder().encode(text).length;
    return bytes < 1024 ? `${bytes} bytes` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getContentPreview = (content: any) => {
    switch (content.type) {
      case 'message':
        return content.message?.content?.substring(0, 100) + '...' || 'No content';
      case 'conversation':
        const totalMessages = content.conversation?.length || 0;
        return `${totalMessages} messages in conversation`;
      case 'highlighted_text':
        return content.highlightedText?.substring(0, 100) + '...' || 'No highlighted text';
      default:
        return 'No content available';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Save className="h-5 w-5" />
            <span>Save to Google Drive</span>
            <Badge variant="secondary" className="ml-auto">
              {content.type.replace('_', ' ')}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Save your content with AI enhancement and organization
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {/* Content Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Content Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline">{content.type.replace('_', ' ')}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Size:</span>
                  <span>{formatSize(content)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Context:</span>
                  <span>{content.context?.subject || 'General'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Preview:</span>
                  <p className="mt-1 text-xs text-muted-foreground bg-muted p-2 rounded">
                    {getContentPreview(content)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* File Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="fileName">File Name</Label>
                <Input
                  id="fileName"
                  value={saveOptions.fileName}
                  onChange={(e) => setSaveOptions(prev => ({ ...prev, fileName: e.target.value }))}
                  placeholder="Enter file name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="folder">Save Location</Label>
                <Select
                  value={saveOptions.folder}
                  onValueChange={(value) => setSaveOptions(prev => ({ ...prev, folder: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="StudyBuddy/Saved Content">StudyBuddy/Saved Content</SelectItem>
                    <SelectItem value="StudyBuddy/Messages">StudyBuddy/Messages</SelectItem>
                    <SelectItem value="StudyBuddy/Conversations">StudyBuddy/Conversations</SelectItem>
                    <SelectItem value="StudyBuddy/Highlights">StudyBuddy/Highlights</SelectItem>
                    <SelectItem value="StudyBuddy/Summaries">StudyBuddy/Summaries</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="format">File Format</Label>
                <Select
                  value={saveOptions.format}
                  onValueChange={(value: 'txt' | 'pdf' | 'docx' | 'markdown') => 
                    setSaveOptions(prev => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="txt">Plain Text (.txt)</SelectItem>
                    <SelectItem value="markdown">Markdown (.md)</SelectItem>
                    <SelectItem value="pdf">PDF Document (.pdf)</SelectItem>
                    <SelectItem value="docx">Word Document (.docx)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Options Tab */}
          <TabsContent value="options" className="space-y-4">
            {/* AI Enhancement Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Enhancement</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>AI Analysis</Label>
                    <p className="text-xs text-muted-foreground">
                      Generate topics, key concepts, and study tips
                    </p>
                  </div>
                  <Switch
                    checked={saveOptions.options.aiEnhancement}
                    onCheckedChange={(checked) => 
                      setSaveOptions(prev => ({
                        ...prev,
                        options: { ...prev.options, aiEnhancement: checked }
                      }))
                    }
                  />
                </div>

                {saveOptions.options.aiEnhancement && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Create Summary</Label>
                        <p className="text-xs text-muted-foreground">
                          Generate AI-powered content summary
                        </p>
                      </div>
                      <Switch
                        checked={saveOptions.options.createSummary}
                        onCheckedChange={(checked) => 
                          setSaveOptions(prev => ({
                            ...prev,
                            options: { ...prev.options, createSummary: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Add Tags</Label>
                        <p className="text-xs text-muted-foreground">
                          Auto-generate relevant tags
                        </p>
                      </div>
                      <Switch
                        checked={saveOptions.options.addTags}
                        onCheckedChange={(checked) => 
                          setSaveOptions(prev => ({
                            ...prev,
                            options: { ...prev.options, addTags: checked }
                          }))
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Content Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Content Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Include Metadata</Label>
                    <p className="text-xs text-muted-foreground">
                      Add timestamps and context information
                    </p>
                  </div>
                  <Switch
                    checked={saveOptions.options.includeMetadata}
                    onCheckedChange={(checked) => 
                      setSaveOptions(prev => ({
                        ...prev,
                        options: { ...prev.options, includeMetadata: checked }
                      }))
                    }
                  />
                </div>

                {content.type === 'message' && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Conversation Context</Label>
                      <p className="text-xs text-muted-foreground">
                        Include surrounding conversation
                      </p>
                    </div>
                    <Switch
                      checked={saveOptions.options.includeConversationContext}
                      onCheckedChange={(checked) => 
                        setSaveOptions(prev => ({
                          ...prev,
                          options: { ...prev.options, includeConversationContext: checked }
                        }))
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                value={saveOptions.tags.join(', ')}
                onChange={(e) => 
                  setSaveOptions(prev => ({
                    ...prev,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  }))
                }
                placeholder="Enter tags separated by commas"
                className="mt-1"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={saveOptions.notes}
                onChange={(e) => setSaveOptions(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes about this content"
                className="mt-1"
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            {/* AI Analysis Results */}
            {saveProgress > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Analysis</span>
                    {saveProgress < 100 && (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={saveProgress} className="mb-4" />
                  
                  {aiAnalysis && (
                    <div className="space-y-4">
                      {aiAnalysis.topics.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Topics</h4>
                          <div className="flex flex-wrap gap-1">
                            {aiAnalysis.topics.map((topic, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiAnalysis.keyConcepts.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Key Concepts</h4>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {aiAnalysis.keyConcepts.map((concept, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-current rounded-full" />
                                <span>{concept}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiAnalysis.summary && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Summary</h4>
                          <p className="text-xs text-muted-foreground">{aiAnalysis.summary}</p>
                        </div>
                      )}

                      {aiAnalysis.studyTips.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Study Tips</h4>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {aiAnalysis.studyTips.map((tip, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Content Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">File Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded text-xs font-mono max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">
                    {content.type === 'conversation' 
                      ? `Conversation (${content.conversation?.length || 0} messages)\n\n` +
                        (content.conversation || []).map(msg => 
                          `[${msg.role}] ${new Date(msg.timestamp).toLocaleString()}\n${msg.content}\n`
                        ).join('\n')
                      : content.type === 'message'
                      ? `[${content.message?.role}] ${new Date(content.message?.timestamp).toLocaleString()}\n${content.message?.content}`
                      : content.highlightedText || 'No content to preview'
                    }
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          <Button onClick={handleSave} disabled={isSaving || !saveOptions.fileName.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save to Drive
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SaveDialog;