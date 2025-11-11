// Save History Component
// ======================
// Shows recently saved content with quick access and management features

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  FileText, 
  MessageCircle, 
  Highlighter, 
  Download, 
  ExternalLink,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SavedContent {
  id: string;
  content_type: 'message' | 'conversation' | 'highlighted_text';
  content_preview: string;
  save_format: string;
  file_name: string;
  drive_file_url?: string;
  folder_path: string;
  ai_enhanced: boolean;
  ai_summary?: string;
  ai_tags?: string[];
  created_at: string;
  metadata?: {
    notes?: string;
    originalTags?: string[];
    wordCount?: number;
  };
}

interface SaveHistoryProps {
  userId: string;
  className?: string;
  maxItems?: number;
  showFilters?: boolean;
  onContentSelect?: (content: SavedContent) => void;
}

export function SaveHistory({
  userId,
  className = '',
  maxItems = 10,
  showFilters = true,
  onContentSelect
}: SaveHistoryProps) {
  const { toast } = useToast();
  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<SavedContent | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Load save history
  const loadSaveHistory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: maxItems.toString(),
        offset: '0',
      });

      if (typeFilter !== 'all') {
        params.set('content_type', typeFilter);
      }

      const response = await fetch(`/api/google-drive/history?${params}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      const result = await response.json();

      if (result.success) {
        setSavedContent(result.data.items);
      } else {
        throw new Error(result.error || 'Failed to load save history');
      }
    } catch (error) {
      console.error('Failed to load save history:', error);
      toast({
        title: 'Load failed',
        description: 'Failed to load save history. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadSaveHistory();
    }
  }, [userId, typeFilter, maxItems]);

  // Filter content based on search query
  const filteredContent = savedContent.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.file_name.toLowerCase().includes(query) ||
        item.content_preview.toLowerCase().includes(query) ||
        item.ai_summary?.toLowerCase().includes(query) ||
        item.ai_tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // Get content type icon
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-4 h-4" />;
      case 'conversation':
        return <FileText className="w-4 h-4" />;
      case 'highlighted_text':
        return <Highlighter className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Get content type badge color
  const getContentBadgeColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'conversation':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'highlighted_text':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle content selection
  const handleContentSelect = (content: SavedContent) => {
    setSelectedItem(content);
    if (onContentSelect) {
      onContentSelect(content);
    }
  };

  // Open in Google Drive
  const openInDrive = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Delete saved content
  const deleteContent = async (contentId: string) => {
    try {
      // In a real implementation, you'd have a delete endpoint
      await fetch(`/api/google-drive/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          savedContentId: contentId,
          action: 'deleted',
        }),
      });

      // Remove from local state
      setSavedContent(prev => prev.filter(item => item.id !== contentId));
      
      toast({
        title: 'Deleted',
        description: 'Saved content has been removed from history.',
      });
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete saved content.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Save History</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Save History</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadSaveHistory}
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search saved content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                  <SelectItem value="conversation">Conversations</SelectItem>
                  <SelectItem value="highlighted_text">Highlights</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Save History List */}
          <div className="space-y-3">
            {filteredContent.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  {searchQuery || typeFilter !== 'all' 
                    ? 'No matching saved content found' 
                    : 'No saved content yet'
                  }
                </p>
                <p className="text-xs mt-1">
                  Start saving messages and conversations to see them here
                </p>
              </div>
            ) : (
              filteredContent.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleContentSelect(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {getContentIcon(item.content_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium truncate">
                            {item.file_name}
                          </h4>
                          <Badge 
                            variant="secondary" 
                            className={cn('text-xs', getContentBadgeColor(item.content_type))}
                          >
                            {item.content_type.replace('_', ' ')}
                          </Badge>
                          {item.ai_enhanced && (
                            <Badge variant="outline" className="text-xs">
                              AI Enhanced
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.content_preview}
                        </p>
                        
                        {item.ai_tags && item.ai_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.ai_tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {item.ai_tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.ai_tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
                          <span>{formatDate(item.created_at)}</span>
                          <span>•</span>
                          <span>{item.save_format.toUpperCase()}</span>
                          <span>•</span>
                          <span className="truncate">{item.folder_path}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {item.drive_file_url && (
                          <DropdownMenuItem onClick={() => openInDrive(item.drive_file_url!)}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open in Drive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleContentSelect(item)}>
                          <FileText className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteContent(item.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove from History
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedItem && getContentIcon(selectedItem.content_type)}
              <span>{selectedItem?.file_name}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                <Badge className={getContentBadgeColor(selectedItem.content_type)}>
                  {selectedItem.content_type.replace('_', ' ')}
                </Badge>
                <Badge variant="outline">
                  {selectedItem.save_format.toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {formatDate(selectedItem.created_at)}
                </Badge>
                {selectedItem.ai_enhanced && (
                  <Badge variant="secondary">AI Enhanced</Badge>
                )}
              </div>

              {/* Tags */}
              {selectedItem.ai_tags && selectedItem.ai_tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedItem.ai_tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {selectedItem.ai_summary && (
                <div>
                  <h4 className="text-sm font-medium mb-2">AI Summary</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {selectedItem.ai_summary}
                  </p>
                </div>
              )}

              {/* Content Preview */}
              <div>
                <h4 className="text-sm font-medium mb-2">Content Preview</h4>
                <div className="bg-muted p-3 rounded text-sm max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans">
                    {selectedItem.content_preview}
                  </pre>
                </div>
              </div>

              {/* Notes */}
              {selectedItem.metadata?.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <Textarea
                    value={selectedItem.metadata.notes}
                    readOnly
                    className="min-h-20 resize-none"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                {selectedItem.drive_file_url && (
                  <Button
                    variant="outline"
                    onClick={() => openInDrive(selectedItem.drive_file_url!)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in Drive
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SaveHistory;